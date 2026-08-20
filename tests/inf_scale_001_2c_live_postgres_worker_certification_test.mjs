import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PostgresAnalysisJobQueue } from '../services/postgresAnalysisJobQueue.js';
import { PostgresAnalysisSessionStore } from '../services/postgresAnalysisSessionStore.js';
import { AnalysisWorkerPool } from '../services/analysisWorkerPool.js';
import { encodeAnalysisJobPayload } from '../services/analysisJobPayloadCodec.js';

const live = process.env.DATABASE_URL ? test : test.skip;

live('INF-SCALE-001.2C live PostgreSQL certifies two workers produce one clinical execution and one completed result', async () => {
  const suffix = crypto.randomUUID();
  const userId = `0012c-${suffix}`;
  const idempotencyKey = `0012c-${suffix}`;
  const queueA = new PostgresAnalysisJobQueue();
  const queueB = new PostgresAnalysisJobQueue();
  const sessionsA = new PostgresAnalysisSessionStore();
  const sessionsB = new PostgresAnalysisSessionStore();
  let executions = 0;

  try {
    const { session } = await sessionsA.createOrReuse({ userId, idempotencyKey, metadata: { certification: '001.2C' } });
    const payload = encodeAnalysisJobPayload({
      images: [{ originalname: 'x.png', mimetype: 'image/png', buffer: Buffer.from('abc'), size: 3 }],
      analysisSource: 'ai_visual',
      manualCounts: {},
      analysisType: 'peripheral_blood',
      specimenType: 'peripheral_blood',
    });
    await queueA.enqueue({ analysisId: session.analysisId, userId, payload });

    const boundary = {
      execute: async () => {
        executions += 1;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, certification: '001.2C' };
      },
    };
    const cfg = {
      architectureVersion: 'INF-SCALE-001.2C', concurrency: 1, pollIntervalMs: 100,
      jobLeaseTtlMs: 300000, sessionLeaseTtlMs: 300000, heartbeatIntervalMs: 10000,
      maxQueueDepth: 100, retryBaseDelayMs: 1000,
    };
    const poolA = new AnalysisWorkerPool({ queue: queueA, sessionStore: sessionsA, executionBoundary: boundary, config: cfg, logger: { error() {} } });
    const poolB = new AnalysisWorkerPool({ queue: queueB, sessionStore: sessionsB, executionBoundary: boundary, config: cfg, logger: { error() {} } });

    await Promise.all([poolA.runOnce('live-a'), poolB.runOnce('live-b')]);
    const finalSession = await sessionsB.get(session.analysisId, userId);
    const finalJob = await queueB.getByAnalysisId(session.analysisId);
    assert.equal(executions, 1);
    assert.equal(finalSession.status, 'COMPLETED');
    assert.equal(finalSession.result.certification, '001.2C');
    assert.equal(finalJob.status, 'COMPLETED');
  } finally {
    // Live certification intentionally leaves only tiny terminal rows; queue payload is redacted on completion.
    await Promise.allSettled([queueA.close(), queueB.close(), sessionsA.close(), sessionsB.close()]);
  }
});
