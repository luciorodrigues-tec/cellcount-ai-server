import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const INF_SCALE_001_2B_VERSION = 'INF-SCALE-001.2B.2';
export const ANALYSIS_JOB_QUEUE_SCHEMA_VERSION = 1;
export const ANALYSIS_JOB_QUEUE_SCHEMA_ADVISORY_LOCK_KEY = 510001002;

export const ANALYSIS_JOB_STATES = Object.freeze({
  queued: 'QUEUED',
  processing: 'PROCESSING',
  retryEligible: 'RETRY_ELIGIBLE',
  completed: 'COMPLETED',
  failed: 'FAILED',
});

function safe(value, max = 160) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9._:@-]/g, '_').slice(0, max);
}
function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
function positiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}
function sslConfig(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  if (!normalized || normalized === 'disable' || normalized === 'false') return undefined;
  if (normalized === 'verify-full') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}
function normalizedError(error) {
  return {
    code: String(error?.code || 'ANALYSIS_JOB_FAILED'),
    message: String(error?.message || error || 'Analysis job failed').slice(0, 1000),
    statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
    occurredAt: new Date().toISOString(),
  };
}

export function buildAnalysisJobQueueSchemaSql() {
  return `
CREATE TABLE IF NOT EXISTS cellcount_analysis_jobs (
  job_id uuid PRIMARY KEY,
  analysis_id uuid NOT NULL,
  user_id varchar(160) NOT NULL,
  status varchar(32) NOT NULL,
  payload jsonb NOT NULL,
  attempt integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  available_at timestamptz NOT NULL,
  lease_token varchar(160),
  worker_id varchar(160),
  leased_at timestamptz,
  lease_expires_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  last_error jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  schema_version integer NOT NULL DEFAULT ${ANALYSIS_JOB_QUEUE_SCHEMA_VERSION},
  CONSTRAINT cellcount_analysis_jobs_analysis_uq UNIQUE (analysis_id)
);
CREATE INDEX IF NOT EXISTS cellcount_analysis_jobs_claim_idx
  ON cellcount_analysis_jobs (status, available_at, created_at);
CREATE INDEX IF NOT EXISTS cellcount_analysis_jobs_lease_idx
  ON cellcount_analysis_jobs (lease_expires_at)
  WHERE status = 'PROCESSING';
`;
}

function rowToJob(row) {
  if (!row) return null;
  return {
    queueVersion: INF_SCALE_001_2B_VERSION,
    jobId: row.job_id,
    analysisId: row.analysis_id,
    userId: row.user_id,
    status: row.status,
    payload: clone(row.payload),
    attempt: Number(row.attempt),
    maxAttempts: Number(row.max_attempts),
    availableAt: row.available_at instanceof Date ? row.available_at.toISOString() : row.available_at,
    leaseToken: row.lease_token || null,
    workerId: row.worker_id || null,
    leasedAt: row.leased_at instanceof Date ? row.leased_at.toISOString() : row.leased_at,
    leaseExpiresAt: row.lease_expires_at instanceof Date ? row.lease_expires_at.toISOString() : row.lease_expires_at,
    completedAt: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at,
    failedAt: row.failed_at instanceof Date ? row.failed_at.toISOString() : row.failed_at,
    lastError: clone(row.last_error),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export class PostgresAnalysisJobQueue {
  constructor({
    connectionString = process.env.DATABASE_URL,
    sslMode = process.env.DATABASE_SSL_MODE,
    pool = null,
    maxAttempts = positiveInt(process.env.ANALYSIS_JOB_MAX_ATTEMPTS, 3),
    leaseTtlMs = positiveInt(process.env.ANALYSIS_JOB_LEASE_TTL_MS, 120_000),
    autoMigrate = true,
  } = {}) {
    if (!pool && !connectionString) {
      throw new Error('INF-SCALE-001.2B: DATABASE_URL is required for durable PostgreSQL job queue.');
    }
    if (pool) {
      this.pool = pool;
    } else {
      let Pool;
      try { ({ Pool } = require('pg')); }
      catch (error) {
        throw new Error('INF-SCALE-001.2B: pg dependency is required for PostgreSQL job queue.', { cause: error });
      }
      this.pool = new Pool({
        connectionString,
        ssl: sslConfig(sslMode),
        max: positiveInt(process.env.ANALYSIS_JOB_DB_POOL_MAX, 10),
        idleTimeoutMillis: positiveInt(process.env.ANALYSIS_JOB_DB_IDLE_TIMEOUT_MS, 30_000),
        connectionTimeoutMillis: positiveInt(process.env.ANALYSIS_JOB_DB_CONNECTION_TIMEOUT_MS, 10_000),
      });
    }
    this.maxAttempts = positiveInt(maxAttempts, 3);
    this.leaseTtlMs = positiveInt(leaseTtlMs, 120_000);
    this.autoMigrate = autoMigrate;
    this._schemaReady = false;
    this._schemaPromise = null;
  }

  get scalabilityMetadata() {
    return Object.freeze({
      architectureVersion: INF_SCALE_001_2B_VERSION,
      provider: 'postgres',
      durable: true,
      distributed: true,
      duplicateJobAuthority: 'postgres_unique_analysis_id',
      claimAuthority: 'postgres_for_update_skip_locked',
      payloadAuthority: 'postgres_jsonb_transitional',
      payloadRedactionOnCompletion: true,
    });
  }

  async ensureSchema() {
    if (this._schemaReady || !this.autoMigrate) return;
    if (!this._schemaPromise) {
      this._schemaPromise = (async () => {
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [ANALYSIS_JOB_QUEUE_SCHEMA_ADVISORY_LOCK_KEY]);
          await client.query(buildAnalysisJobQueueSchemaSql());
          await client.query('COMMIT');
          this._schemaReady = true;
        } catch (error) {
          try { await client.query('ROLLBACK'); } catch {}
          throw error;
        } finally {
          client.release();
        }
      })().catch((error) => { this._schemaPromise = null; throw error; });
    }
    await this._schemaPromise;
  }

  async close() { if (typeof this.pool?.end === 'function') await this.pool.end(); }

  async enqueue({ analysisId, userId, payload, availableAt = null } = {}) {
    const normalizedAnalysisId = safe(analysisId);
    const normalizedUserId = safe(userId || 'anonymous_device');
    if (!normalizedAnalysisId) throw new Error('analysisId is required');
    if (!payload || typeof payload !== 'object') throw new Error('payload is required');
    await this.ensureSchema();
    const jobId = crypto.randomUUID();
    const result = await this.pool.query(
      `INSERT INTO cellcount_analysis_jobs
        (job_id, analysis_id, user_id, status, payload, attempt, max_attempts, available_at, created_at, updated_at, schema_version)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5::jsonb, 0, $6,
               COALESCE($7::timestamptz, NOW()), NOW(), NOW(), $8)
       ON CONFLICT (analysis_id) DO NOTHING
       RETURNING *`,
      [jobId, normalizedAnalysisId, normalizedUserId, ANALYSIS_JOB_STATES.queued, JSON.stringify(payload), this.maxAttempts, availableAt, ANALYSIS_JOB_QUEUE_SCHEMA_VERSION],
    );
    if (result.rows.length === 1) return { job: rowToJob(result.rows[0]), reused: false };
    const existing = await this.pool.query('SELECT * FROM cellcount_analysis_jobs WHERE analysis_id = $1::uuid', [normalizedAnalysisId]);
    if (existing.rows.length !== 1) throw new Error('INF-SCALE-001.2B: duplicate job conflict could not be resolved.');
    return { job: rowToJob(existing.rows[0]), reused: true };
  }

  async getByAnalysisId(analysisId) {
    await this.ensureSchema();
    const result = await this.pool.query('SELECT * FROM cellcount_analysis_jobs WHERE analysis_id = $1::uuid', [safe(analysisId)]);
    return rowToJob(result.rows[0]);
  }

  async claimNext({ workerId = 'cellcount-worker', leaseTtlMs = this.leaseTtlMs, analysisId = null } = {}) {
    await this.ensureSchema();
    const client = await this.pool.connect();
    const scopedAnalysisId = analysisId ? safe(analysisId) : null;
    try {
      await client.query('BEGIN');
      const selected = await client.query(
        `SELECT * FROM cellcount_analysis_jobs
         WHERE (
           (status IN ('QUEUED', 'RETRY_ELIGIBLE') AND available_at <= NOW())
           OR (status = 'PROCESSING' AND lease_expires_at <= NOW())
         )
         AND attempt < max_attempts
         AND ($1::uuid IS NULL OR analysis_id = $1::uuid)
         ORDER BY available_at ASC, created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1`,
        [scopedAnalysisId],
      );
      if (selected.rows.length === 0) {
        await client.query('COMMIT');
        return { acquired: false, job: null, leaseToken: null };
      }
      const row = selected.rows[0];
      const token = crypto.randomUUID();
      const updated = await client.query(
        `UPDATE cellcount_analysis_jobs
         SET status='PROCESSING', attempt=attempt+1, worker_id=$2, lease_token=$3,
             leased_at=NOW(), lease_expires_at=NOW() + ($4::bigint * INTERVAL '1 millisecond'),
             updated_at=NOW()
         WHERE job_id=$1::uuid
         RETURNING *`,
        [row.job_id, safe(workerId), token, positiveInt(leaseTtlMs, this.leaseTtlMs)],
      );
      await client.query('COMMIT');
      return { acquired: true, job: rowToJob(updated.rows[0]), leaseToken: token };
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error;
    } finally { client.release(); }
  }

  async renewLease(jobId, leaseToken, { leaseTtlMs = this.leaseTtlMs } = {}) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `UPDATE cellcount_analysis_jobs
       SET lease_expires_at=NOW() + ($3::bigint * INTERVAL '1 millisecond'), updated_at=NOW()
       WHERE job_id=$1::uuid AND status='PROCESSING' AND lease_token=$2
         AND lease_expires_at > NOW()
       RETURNING *`,
      [safe(jobId), String(leaseToken || ''), positiveInt(leaseTtlMs, this.leaseTtlMs)],
    );
    if (result.rows.length !== 1) {
      const error = new Error('INF-SCALE-001.2C: stale or expired job lease cannot be renewed.');
      error.code = 'ANALYSIS_JOB_LEASE_LOST';
      throw error;
    }
    return rowToJob(result.rows[0]);
  }

  async getBackpressureSnapshot({ maxQueueDepth = positiveInt(process.env.ANALYSIS_QUEUE_MAX_DEPTH, 100) } = {}) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('QUEUED','RETRY_ELIGIBLE'))::int AS waiting,
         COUNT(*) FILTER (WHERE status='PROCESSING')::int AS processing,
         COUNT(*) FILTER (WHERE status IN ('QUEUED','RETRY_ELIGIBLE','PROCESSING'))::int AS active
       FROM cellcount_analysis_jobs`,
    );
    const row = result.rows[0] || {};
    const active = Number(row.active || 0);
    const limit = positiveInt(maxQueueDepth, 100);
    return Object.freeze({
      architectureVersion: 'INF-SCALE-001.2C',
      waiting: Number(row.waiting || 0),
      processing: Number(row.processing || 0),
      active,
      maxQueueDepth: limit,
      saturated: active >= limit,
    });
  }

  async assertEnqueueCapacity({ analysisId, maxQueueDepth = positiveInt(process.env.ANALYSIS_QUEUE_MAX_DEPTH, 100) } = {}) {
    await this.ensureSchema();
    const normalizedAnalysisId = safe(analysisId);
    if (normalizedAnalysisId) {
      const existing = await this.pool.query(
        'SELECT job_id FROM cellcount_analysis_jobs WHERE analysis_id=$1::uuid LIMIT 1',
        [normalizedAnalysisId],
      );
      if (existing.rows.length) return { accepted: true, existing: true };
    }
    const snapshot = await this.getBackpressureSnapshot({ maxQueueDepth });
    if (snapshot.saturated) {
      const error = new Error('Fila de análises temporariamente saturada. Tente novamente em instantes.');
      error.code = 'ANALYSIS_QUEUE_BACKPRESSURE';
      error.statusCode = 503;
      error.retryAfterMs = 5000;
      error.snapshot = snapshot;
      throw error;
    }
    return { accepted: true, existing: false, snapshot };
  }

  async markCompleted(jobId, leaseToken) {
    await this.ensureSchema();
    const result = await this.pool.query(
      `UPDATE cellcount_analysis_jobs
       SET status='COMPLETED', completed_at=NOW(), updated_at=NOW(), payload='{}'::jsonb,
           lease_token=NULL, worker_id=NULL, leased_at=NULL, lease_expires_at=NULL
       WHERE job_id=$1::uuid AND status='PROCESSING' AND lease_token=$2
       RETURNING *`,
      [safe(jobId), String(leaseToken || '')],
    );
    if (result.rows.length !== 1) throw new Error('INF-SCALE-001.2B: stale or invalid job lease cannot complete job.');
    return rowToJob(result.rows[0]);
  }

  async markFailed(jobId, leaseToken, error, { retryable = true, retryDelayMs = 3000 } = {}) {
    await this.ensureSchema();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const selected = await client.query(
        `SELECT * FROM cellcount_analysis_jobs
         WHERE job_id=$1::uuid AND status='PROCESSING' AND lease_token=$2
         FOR UPDATE`,
        [safe(jobId), String(leaseToken || '')],
      );
      if (selected.rows.length !== 1) throw new Error('INF-SCALE-001.2B: stale or invalid job lease cannot fail job.');
      const row = selected.rows[0];
      const canRetry = Boolean(retryable) && Number(row.attempt) < Number(row.max_attempts);
      const status = canRetry ? ANALYSIS_JOB_STATES.retryEligible : ANALYSIS_JOB_STATES.failed;
      const updated = await client.query(
        `UPDATE cellcount_analysis_jobs
         SET status=$3, last_error=$4::jsonb,
             available_at=CASE WHEN $5 THEN NOW() + ($6::bigint * INTERVAL '1 millisecond') ELSE available_at END,
             failed_at=CASE WHEN $5 THEN NULL ELSE NOW() END,
             updated_at=NOW(), lease_token=NULL, worker_id=NULL, leased_at=NULL, lease_expires_at=NULL
         WHERE job_id=$1::uuid AND lease_token=$2
         RETURNING *`,
        [safe(jobId), String(leaseToken || ''), status, JSON.stringify(normalizedError(error)), canRetry, Math.max(0, Number(retryDelayMs) || 0)],
      );
      await client.query('COMMIT');
      return rowToJob(updated.rows[0]);
    } catch (error2) {
      try { await client.query('ROLLBACK'); } catch {}
      throw error2;
    } finally { client.release(); }
  }
}
