import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export const FORENSICS_VERSION = 'INF-SCALE-001.2F.1';
export const FORENSICS_ATTRIBUTION_VERSION = 'INF-SCALE-001.2F.2';
export const DEFAULT_USER_PREFIX = 'inf-scale-001-2f-';
export const DEFAULT_TIMEOUT_MS = 900_000;

function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min) return fallback;
  return Math.min(n, max);
}

function sslConfig(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  if (!normalized || normalized === 'disable' || normalized === 'false') return undefined;
  if (normalized === 'verify-full') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

function iso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function ms(value) {
  const n = Date.parse(String(value || ''));
  return Number.isFinite(n) ? n : null;
}

function ageMs(from, to = Date.now()) {
  const f = ms(from);
  if (f == null) return null;
  return Math.max(0, to - f);
}

export function classifyForensicRecord(record, { timeoutMs = DEFAULT_TIMEOUT_MS, nowMs = Date.now() } = {}) {
  const job = record.job || {};
  const session = record.session || {};
  const createdMs = ms(job.createdAt || session.createdAt);
  const completedMs = ms(session.completedAt || job.completedAt);
  const jobLeaseMs = ms(job.leaseExpiresAt);
  const sessionLeaseMs = ms(session.leaseExpiresAt);
  const elapsedMs = createdMs == null ? null : ((completedMs ?? nowMs) - createdMs);
  const jobLeaseExpired = jobLeaseMs != null && jobLeaseMs <= nowMs;
  const sessionLeaseExpired = sessionLeaseMs != null && sessionLeaseMs <= nowMs;

  let diagnosis = 'UNCLASSIFIED';
  if (job.status === 'COMPLETED' && session.status === 'COMPLETED') {
    diagnosis = elapsedMs != null && elapsedMs > timeoutMs ? 'LATE_COMPLETION_AFTER_HARNESS_TIMEOUT' : 'CLEAN_COMPLETION';
  } else if (session.status === 'COMPLETED' && job.status !== 'COMPLETED') {
    diagnosis = 'SESSION_COMPLETED_JOB_ACK_STALL';
  } else if (job.status === 'COMPLETED' && session.status !== 'COMPLETED') {
    diagnosis = 'JOB_COMPLETED_SESSION_TRANSITION_MISMATCH';
  } else if (job.status === 'PROCESSING' && session.status === 'PROCESSING') {
    if (jobLeaseExpired || sessionLeaseExpired) diagnosis = 'ORPHANED_OR_EXPIRED_DUAL_LEASE';
    else diagnosis = 'ACTIVE_EXECUTION_OR_UPSTREAM_STALL';
  } else if (job.status === 'QUEUED' || job.status === 'RETRY_ELIGIBLE') {
    diagnosis = 'QUEUE_WAIT_OR_RETRY_STARVATION';
  } else if (session.status === 'RETRY_ELIGIBLE' || job.status === 'RETRY_ELIGIBLE') {
    diagnosis = 'RETRY_ELIGIBLE_AFTER_WORKER_FAILURE';
  } else if (session.status === 'FAILED' || session.status === 'EXPIRED' || job.status === 'FAILED') {
    diagnosis = 'TERMINAL_FAILURE';
  }

  return {
    diagnosis,
    elapsedMs,
    exceededHarnessTimeout: elapsedMs != null && elapsedMs > timeoutMs,
    jobLeaseExpired,
    sessionLeaseExpired,
  };
}

export function summarizeForensics(records) {
  const diagnoses = {};
  const workerIds = new Set();
  let completed = 0;
  let stillActive = 0;
  let terminal = 0;
  for (const record of records) {
    diagnoses[record.forensic.diagnosis] = (diagnoses[record.forensic.diagnosis] || 0) + 1;
    if (record.job.lastWorkerId || record.job.workerId) workerIds.add(record.job.lastWorkerId || record.job.workerId);
    if (record.session.status === 'COMPLETED') completed += 1;
    if (record.session.status === 'PROCESSING' || record.job.status === 'PROCESSING') stillActive += 1;
    if (['FAILED', 'EXPIRED'].includes(record.session.status) || record.job.status === 'FAILED') terminal += 1;
  }
  return {
    records: records.length,
    completed,
    stillActive,
    terminal,
    distinctWorkersObserved: workerIds.size,
    diagnoses,
  };
}

async function fetchRecent(pool, { prefix, limit }) {
  const result = await pool.query(
    `SELECT
       j.job_id, j.analysis_id, j.user_id,
       j.status AS job_status, j.attempt AS job_attempt, j.max_attempts AS job_max_attempts,
       j.worker_id, j.leased_at, j.lease_expires_at AS job_lease_expires_at,
       j.last_worker_id, j.last_leased_at, j.last_lease_expires_at, j.last_lease_released_at,
       j.completed_at AS job_completed_at, j.failed_at AS job_failed_at,
       j.last_error AS job_last_error, j.created_at AS job_created_at, j.updated_at AS job_updated_at,
       s.status AS session_status, s.session AS session_json,
       s.created_at AS session_created_at, s.updated_at AS session_updated_at
     FROM cellcount_analysis_jobs j
     LEFT JOIN cellcount_analysis_sessions s ON s.analysis_id = j.analysis_id
     WHERE j.user_id LIKE $1
     ORDER BY j.created_at DESC
     LIMIT $2`,
    [`${prefix}%`, limit],
  );
  return result.rows;
}

function sanitizeRow(row) {
  const s = row.session_json && typeof row.session_json === 'object' ? row.session_json : {};
  return {
    analysisId: row.analysis_id,
    userId: row.user_id,
    job: {
      jobId: row.job_id,
      status: row.job_status,
      attempt: Number(row.job_attempt || 0),
      maxAttempts: Number(row.job_max_attempts || 0),
      workerId: row.worker_id || null,
      lastWorkerId: row.last_worker_id || null,
      leasedAt: iso(row.leased_at),
      lastLeasedAt: iso(row.last_leased_at),
      leaseExpiresAt: iso(row.job_lease_expires_at),
      lastLeaseExpiresAt: iso(row.last_lease_expires_at),
      lastLeaseReleasedAt: iso(row.last_lease_released_at),
      completedAt: iso(row.job_completed_at),
      failedAt: iso(row.job_failed_at),
      createdAt: iso(row.job_created_at),
      updatedAt: iso(row.job_updated_at),
      lastError: row.job_last_error || null,
    },
    session: {
      status: row.session_status || s.status || null,
      attempt: Number(s.attempt || 0),
      startedAt: iso(s.startedAt),
      executionClaimedAt: iso(s.executionClaimedAt),
      leaseExpiresAt: iso(s.leaseExpiresAt),
      completedAt: iso(s.completedAt),
      failedAt: iso(s.failedAt),
      retryAfter: iso(s.retryAfter),
      terminalReason: s.terminalReason || null,
      error: s.error || null,
      createdAt: iso(row.session_created_at || s.createdAt),
      updatedAt: iso(row.session_updated_at || s.updatedAt),
    },
  };
}

export async function main() {
  const connectionString = String(process.env.DATABASE_URL || '').trim();
  if (!connectionString) throw new Error('DATABASE_URL is required. Use the Render External Database URL in this local CMD only.');
  const prefix = String(process.env.CELLCOUNT_FORENSICS_USER_PREFIX || DEFAULT_USER_PREFIX).trim();
  const limit = positiveInt(process.env.CELLCOUNT_FORENSICS_LIMIT, 10, { min: 1, max: 100 });
  const timeoutMs = positiveInt(process.env.CELLCOUNT_FORENSICS_TIMEOUT_MS, DEFAULT_TIMEOUT_MS, { min: 60_000, max: 7_200_000 });

  let Pool;
  try { ({ Pool } = require('pg')); }
  catch (error) { throw new Error('pg dependency is required. Run npm install in the backend.', { cause: error }); }

  const pool = new Pool({
    connectionString,
    ssl: sslConfig(process.env.DATABASE_SSL_MODE || 'require'),
    max: 2,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const rows = await fetchRecent(pool, { prefix, limit });
    assert.ok(rows.length > 0, `No recent analysis jobs found for user prefix ${prefix}`);
    const nowMs = Date.now();
    const records = rows.map(sanitizeRow).map((record) => ({
      ...record,
      forensic: classifyForensicRecord(record, { timeoutMs, nowMs }),
    }));
    const summary = summarizeForensics(records);
    const output = {
      forensicVersion: FORENSICS_VERSION,
      durableWorkerAttributionVersion: FORENSICS_ATTRIBUTION_VERSION,
      generatedAt: new Date(nowMs).toISOString(),
      filter: { userPrefix: prefix, limit, harnessTimeoutMs: timeoutMs },
      summary,
      records,
      safety: {
        payloadIncluded: false,
        clinicalResultIncluded: false,
        leaseTokensIncluded: false,
        databaseUrlIncluded: false,
      },
    };
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await pool.end();
  }
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntrypoint) main().catch((error) => {
  console.error(`[${FORENSICS_VERSION}] FATAL`, error?.stack || error);
  process.exitCode = 1;
});
