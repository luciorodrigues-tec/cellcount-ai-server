import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AnalysisWorkerPool,
  INF_SCALE_001_2C_VERSION,
  resolveAnalysisWorkerPoolConfig,
} from '../services/analysisWorkerPool.js';

function makeJob() {
  return {
    jobId: '11111111-1111-4111-8111-111111111111',
    analysisId: '22222222-2222-4222-8222-222222222222',
    userId: 'u1',
    payload: { codecVersion: 'INF-SCALE-001.2B', images: [] },
  };
}

function config(overrides = {}) {
  return {
    architectureVersion: INF_SCALE_001_2C_VERSION,
    concurrency: 2,
    pollIntervalMs: 100,
    jobLeaseTtlMs: 300000,
    sessionLeaseTtlMs: 300000,
    heartbeatIntervalMs: 10000,
    maxQueueDepth: 25,
    retryBaseDelayMs: 1000,
    ...overrides,
  };
}

test('INF-SCALE-001.2C worker completes session before acknowledging durable job', async () => {
  const events = [];
  const job = makeJob();
  const queue = {
    claimNext: async () => ({ acquired: true, job, leaseToken: 'job-lease' }),
    renewLease: async () => { events.push('renew-job'); },
    markCompleted: async () => { events.push('job-completed'); },
    markFailed: async () => { throw new Error('unexpected queue failure'); },
  };
  const sessionStore = {
    claimExecution: async () => ({ acquired: true, leaseToken: 'session-lease', session: { attempt: 1 } }),
    renewExecutionLease: async () => { events.push('renew-session'); },
    markCompleted: async (_id, _user, result) => { events.push(`session-completed:${result.ok}`); return { status: 'COMPLETED' }; },
    markFailed: async () => { throw new Error('unexpected session failure'); },
  };
  const boundary = { execute: async ({ context }) => ({ ok: true, source: context.source }) };
  const pool = new AnalysisWorkerPool({
    queue,
    sessionStore,
    executionBoundary: boundary,
    config: config(),
    payloadDecoder: () => ({ images: [Buffer.from('x')] }),
    logger: { error() {} },
  });

  const out = await pool.runOnce('w1');
  assert.equal(out.status, 'COMPLETED');
  assert.deepEqual(events.slice(-2), ['session-completed:true', 'job-completed']);
  assert.equal(out.result.source, 'analysis-worker');
});

test('INF-SCALE-001.2C worker mirrors 006.x retry eligibility into durable queue retry', async () => {
  const job = makeJob();
  let queueFailure = null;
  const queue = {
    claimNext: async () => ({ acquired: true, job, leaseToken: 'job-lease' }),
    renewLease: async () => {},
    markCompleted: async () => { throw new Error('unexpected complete'); },
    markFailed: async (_id, _lease, error, options) => { queueFailure = { error, options }; },
  };
  const sessionStore = {
    claimExecution: async () => ({ acquired: true, leaseToken: 'session-lease', session: { attempt: 1 } }),
    renewExecutionLease: async () => {},
    markCompleted: async () => { throw new Error('unexpected session complete'); },
    markFailed: async () => ({ status: 'RETRY_ELIGIBLE' }),
  };
  const error = Object.assign(new Error('temporary upstream'), { code: 'ETIMEDOUT' });
  const pool = new AnalysisWorkerPool({
    queue,
    sessionStore,
    executionBoundary: { execute: async () => { throw error; } },
    config: config(),
    payloadDecoder: () => ({}),
    logger: { error() {} },
  });

  const out = await pool.runOnce('w1');
  assert.equal(out.status, 'RETRY_ELIGIBLE');
  assert.equal(queueFailure.options.retryable, true);
  assert.equal(queueFailure.error, error);
});

test('INF-SCALE-001.2C worker reconciles a queue job whose durable session is already completed', async () => {
  const job = makeJob();
  let completed = 0;
  const pool = new AnalysisWorkerPool({
    queue: {
      claimNext: async () => ({ acquired: true, job, leaseToken: 'job-lease' }),
      markCompleted: async () => { completed += 1; },
      markFailed: async () => { throw new Error('unexpected'); },
    },
    sessionStore: {
      claimExecution: async () => ({ acquired: false, reason: 'COMPLETED', session: { status: 'COMPLETED' } }),
    },
    executionBoundary: { execute: async () => { throw new Error('must not execute'); } },
    config: config(),
    payloadDecoder: () => ({}),
    logger: { error() {} },
  });
  const out = await pool.runOnce('w1');
  assert.equal(out.reconciled, true);
  assert.equal(completed, 1);
});

test('INF-SCALE-001.2C config clamps worker concurrency and exposes explicit backpressure capacity', () => {
  const cfg = resolveAnalysisWorkerPoolConfig({
    ANALYSIS_WORKER_CONCURRENCY: '999',
    ANALYSIS_QUEUE_MAX_DEPTH: '250',
    ANALYSIS_JOB_LEASE_TTL_MS: '300000',
    ANALYSIS_SESSION_LEASE_TTL_MS: '300000',
  });
  assert.equal(cfg.concurrency, 16);
  assert.equal(cfg.maxQueueDepth, 250);
  assert.equal(cfg.architectureVersion, 'INF-SCALE-001.2C');
});
