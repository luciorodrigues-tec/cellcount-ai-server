import os from 'node:os';
import crypto from 'node:crypto';
import { decodeAnalysisJobPayload } from './analysisJobPayloadCodec.js';

export const INF_SCALE_001_2C_VERSION = 'INF-SCALE-001.2C';
export const INF_SCALE_001_2H_F_WORKER_RESIZE_VERSION = 'INF-SCALE-001.2H-F';

function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) return fallback;
  return Math.min(n, max);
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function safeError(error) {
  return {
    code: String(error?.code || 'ANALYSIS_WORKER_EXECUTION_FAILED'),
    message: String(error?.message || error || 'Worker execution failed').slice(0, 1000),
    statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
  };
}
function terminalClaimReason(reason) {
  return ['COMPLETED', 'FAILED', 'MAX_ATTEMPTS_EXHAUSTED', 'EXPIRED'].includes(String(reason || ''));
}

export function resolveAnalysisWorkerPoolConfig(env = process.env) {
  const concurrency = positiveInt(env.ANALYSIS_WORKER_CONCURRENCY, 1, { max: 16 });
  const pollIntervalMs = positiveInt(env.ANALYSIS_WORKER_POLL_INTERVAL_MS, 1000, { min: 100, max: 60_000 });
  const jobLeaseTtlMs = positiveInt(env.ANALYSIS_JOB_LEASE_TTL_MS, 300_000, { min: 30_000, max: 3_600_000 });
  const sessionLeaseTtlMs = positiveInt(env.ANALYSIS_SESSION_LEASE_TTL_MS, 300_000, { min: 30_000, max: 3_600_000 });
  const heartbeatIntervalMs = positiveInt(
    env.ANALYSIS_WORKER_HEARTBEAT_INTERVAL_MS,
    Math.max(10_000, Math.floor(Math.min(jobLeaseTtlMs, sessionLeaseTtlMs) / 3)),
    { min: 5_000, max: 120_000 },
  );
  const maxQueueDepth = positiveInt(env.ANALYSIS_QUEUE_MAX_DEPTH, 100, { min: 1, max: 100_000 });
  const retryBaseDelayMs = positiveInt(env.ANALYSIS_WORKER_RETRY_BASE_DELAY_MS, 3000, { min: 250, max: 300_000 });
  return Object.freeze({
    architectureVersion: INF_SCALE_001_2C_VERSION, concurrency, pollIntervalMs, jobLeaseTtlMs,
    sessionLeaseTtlMs, heartbeatIntervalMs, maxQueueDepth, retryBaseDelayMs,
  });
}

export class AnalysisWorkerPool {
  constructor({
    queue, sessionStore, executionBoundary, config = resolveAnalysisWorkerPoolConfig(),
    workerId = `${os.hostname()}-${process.pid}-${crypto.randomUUID().slice(0, 8)}`,
    logger = console, payloadDecoder = decodeAnalysisJobPayload,
  } = {}) {
    if (!queue) throw new Error('INF-SCALE-001.2C: queue is required.');
    if (!sessionStore) throw new Error('INF-SCALE-001.2C: sessionStore is required.');
    if (!executionBoundary || typeof executionBoundary.execute !== 'function') {
      throw new Error('INF-SCALE-001.2C: executionBoundary is required.');
    }
    this.queue = queue; this.sessionStore = sessionStore; this.executionBoundary = executionBoundary;
    this.config = config; this.workerId = String(workerId); this.logger = logger; this.payloadDecoder = payloadDecoder;
    this.running = false;
    this.targetConcurrency = config.concurrency;
    this.workerSlots = new Map();
    this.nextWorkerOrdinal = 1;
    this.metrics = { claimed:0, completed:0, failed:0, retried:0, leaseRenewals:0, leaseRenewalFailures:0, scaleOutEvents:0 };
  }

  get currentConcurrency() { return this.workerSlots.size; }

  get scalabilityMetadata() {
    return Object.freeze({
      architectureVersion: INF_SCALE_001_2C_VERSION,
      workerResizeVersion: INF_SCALE_001_2H_F_WORKER_RESIZE_VERSION,
      distributedWorkerSafe: true,
      claimAuthority: 'postgres_for_update_skip_locked',
      sessionLeaseAuthority: 'analysis_session_store',
      dualLeaseHeartbeat: true,
      clinicalMutation: false,
      productionActivationReady: true,
      concurrency: this.currentConcurrency || this.targetConcurrency,
      configuredConcurrency: this.config.concurrency,
      targetConcurrency: this.targetConcurrency,
      dynamicScaleOutSupported: true,
      dynamicScaleInSupported: false,
      pollIntervalMs: this.config.pollIntervalMs,
      maxQueueDepth: this.config.maxQueueDepth,
      running: this.running,
      metrics: Object.freeze({ ...this.metrics }),
    });
  }

  #spawnOne() {
    const ordinal = this.nextWorkerOrdinal++;
    const id = `${this.workerId}:${ordinal}`;
    const token = { active: true };
    const promise = this.#loop(id, token).finally(() => this.workerSlots.delete(id));
    this.workerSlots.set(id, { id, token, promise });
    return id;
  }

  start() {
    if (this.running) return;
    this.running = true;
    while (this.workerSlots.size < this.targetConcurrency) this.#spawnOne();
  }

  async scaleOutTo(requestedConcurrency, { maxStepUp = 1, hardMax = 16 } = {}) {
    if (!this.running) throw new Error('INF-SCALE-001.2H-F: worker pool must be running before scale-out.');
    const current = this.currentConcurrency;
    const requested = positiveInt(requestedConcurrency, current, { min: current, max: hardMax });
    const target = Math.min(requested, current + positiveInt(maxStepUp, 1, { max: 8 }), hardMax);
    if (target <= current) return Object.freeze({ changed:false, previous:current, current, spawned:[] });
    const spawned = [];
    this.targetConcurrency = target;
    while (this.workerSlots.size < target) spawned.push(this.#spawnOne());
    this.metrics.scaleOutEvents += 1;
    return Object.freeze({ changed:true, previous:current, current:this.currentConcurrency, spawned });
  }

  async stop() {
    this.running = false;
    for (const slot of this.workerSlots.values()) slot.token.active = false;
    await Promise.allSettled([...this.workerSlots.values()].map((x) => x.promise));
    this.workerSlots.clear();
  }

  async runOnce(workerId = `${this.workerId}:manual`) {
    const claim = await this.queue.claimNext({ workerId, leaseTtlMs: this.config.jobLeaseTtlMs });
    if (!claim?.acquired) return { processed:false, reason:'NO_JOB' };
    this.metrics.claimed += 1;
    return this.#processClaim(claim, workerId);
  }

  async #loop(workerId, token) {
    while (this.running && token.active) {
      try {
        const outcome = await this.runOnce(workerId);
        if (!outcome.processed) await sleep(this.config.pollIntervalMs);
      } catch (error) {
        this.logger?.error?.('INF-SCALE-001.2C worker loop error', safeError(error));
        await sleep(this.config.pollIntervalMs);
      }
    }
  }

  async #processClaim(claim, workerId) {
    const { job, leaseToken: jobLeaseToken } = claim;
    let sessionLeaseToken = null, heartbeat = null, heartbeatFailure = null;
    try {
      const executionInput = this.payloadDecoder(job.payload);
      const sessionClaim = await this.sessionStore.claimExecution(job.analysisId, job.userId);
      if (!sessionClaim?.acquired) {
        if (String(sessionClaim?.reason) === 'COMPLETED') {
          await this.queue.markCompleted(job.jobId, jobLeaseToken); this.metrics.completed += 1;
          return { processed:true, reconciled:true, status:'COMPLETED' };
        }
        const retryable = !terminalClaimReason(sessionClaim?.reason);
        await this.queue.markFailed(job.jobId, jobLeaseToken,
          Object.assign(new Error(`Session execution claim blocked: ${sessionClaim?.reason || 'UNKNOWN'}`),
            { code:`SESSION_CLAIM_${sessionClaim?.reason || 'BLOCKED'}` }),
          { retryable, retryDelayMs:this.config.retryBaseDelayMs });
        if (retryable) this.metrics.retried += 1; else this.metrics.failed += 1;
        return { processed:true, status:retryable ? 'RETRY_ELIGIBLE' : 'FAILED' };
      }
      sessionLeaseToken = sessionClaim.leaseToken;
      heartbeat = setInterval(() => {
        Promise.all([
          this.queue.renewLease(job.jobId, jobLeaseToken, { leaseTtlMs:this.config.jobLeaseTtlMs }),
          this.sessionStore.renewExecutionLease(job.analysisId, job.userId, sessionLeaseToken, { leaseTtlMs:this.config.sessionLeaseTtlMs }),
        ]).then(() => { this.metrics.leaseRenewals += 1; })
          .catch((error) => { heartbeatFailure ??= error; this.metrics.leaseRenewalFailures += 1; });
      }, this.config.heartbeatIntervalMs);
      heartbeat.unref?.();

      const result = await this.executionBoundary.execute({
        input: executionInput,
        context: { analysisId:job.analysisId, userId:job.userId, attempt:sessionClaim.session?.attempt ?? null,
          leaseToken:sessionLeaseToken, source:'analysis-worker' },
      });
      if (heartbeatFailure) throw heartbeatFailure;
      await Promise.all([
        this.queue.renewLease(job.jobId, jobLeaseToken, { leaseTtlMs:this.config.jobLeaseTtlMs }),
        this.sessionStore.renewExecutionLease(job.analysisId, job.userId, sessionLeaseToken, { leaseTtlMs:this.config.sessionLeaseTtlMs }),
      ]);
      await this.sessionStore.markCompleted(job.analysisId, job.userId, result, { leaseToken:sessionLeaseToken });
      await this.queue.markCompleted(job.jobId, jobLeaseToken);
      this.metrics.completed += 1;
      return { processed:true, status:'COMPLETED', result };
    } catch (error) {
      const normalized = safeError(error); let retryable = true;
      if (sessionLeaseToken) {
        try {
          const session = await this.sessionStore.markFailed(job.analysisId, job.userId, error, { leaseToken:sessionLeaseToken });
          retryable = String(session?.status) === 'RETRY_ELIGIBLE';
        } catch (sessionFailure) {
          this.logger?.error?.('INF-SCALE-001.2C session failure transition error', safeError(sessionFailure));
        }
      }
      try {
        await this.queue.markFailed(job.jobId, jobLeaseToken, error, { retryable, retryDelayMs:this.config.retryBaseDelayMs });
      } catch (queueFailure) {
        this.logger?.error?.('INF-SCALE-001.2C queue failure transition error', safeError(queueFailure));
      }
      if (retryable) this.metrics.retried += 1; else this.metrics.failed += 1;
      return { processed:true, status:retryable ? 'RETRY_ELIGIBLE' : 'FAILED', error:normalized };
    } finally { if (heartbeat) clearInterval(heartbeat); }
  }
}
export function createAnalysisWorkerPool(options) { return new AnalysisWorkerPool(options); }
