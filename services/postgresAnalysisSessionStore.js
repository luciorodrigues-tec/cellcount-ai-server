import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import {
  ANALYSIS_SESSION_CONTRACT_VERSION,
  ANALYSIS_SESSION_STATES,
  ANALYSIS_EXECUTION_CLAIM_REASONS,
  ANALYSIS_RECOVERY_ACTIONS,
  ANALYSIS_RETRY_POLICY_VERSION,
  ANALYSIS_RECOVERY_ORCHESTRATION_VERSION,
  DEFAULT_ANALYSIS_MAX_ATTEMPTS,
  DEFAULT_ANALYSIS_LEASE_TTL_MS,
  DEFAULT_ANALYSIS_SESSION_TTL_MS,
} from './analysisSessionStore.js';

const require = createRequire(import.meta.url);

export const INF_SCALE_001_1B_VERSION = 'INF-SCALE-001.1B';
export const POSTGRES_ANALYSIS_SESSION_SCHEMA_VERSION = 1;
export const INF_SCALE_001_1C_SCHEMA_LOCK_VERSION = 'INF-SCALE-001.1C.1';
export const ANALYSIS_SESSION_SCHEMA_ADVISORY_LOCK_KEY = 510001001;

const TERMINAL = new Set([
  ANALYSIS_SESSION_STATES.completed,
  ANALYSIS_SESSION_STATES.failed,
  ANALYSIS_SESSION_STATES.expired,
]);

const RETRYABLE_ERROR_CODES = new Set([
  'ANALYZE_SLIDE_ERROR',
  'VISUAL_ACQUISITION_TECHNICAL_FAILURE',
  'INCOMPLETE_VISUAL_EVIDENCE',
  'VISUAL_ACQUISITION_FAILED',
  'UPSTREAM_TIMEOUT',
  'UPSTREAM_RATE_LIMIT',
  'NETWORK_ERROR',
  'OPENAI_TIMEOUT',
  'OPENAI_RATE_LIMIT',
  'ORPHANED_EXECUTION_LEASE_EXPIRED',
]);

function safeKey(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9._:-]/g, '_')
    .slice(0, 160);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function toIso(ms) {
  return new Date(ms).toISOString();
}

function isoMs(value) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizedError(error) {
  return {
    code: String(error?.code || 'ANALYSIS_FAILED'),
    message: String(error?.message || error || 'Analysis failed'),
    statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
    occurredAt: new Date().toISOString(),
  };
}

function isRetryableFailure(error) {
  const normalized = normalizedError(error);
  if (RETRYABLE_ERROR_CODES.has(normalized.code)) return true;
  if (normalized.statusCode === 408 || normalized.statusCode === 429) return true;
  return Number.isInteger(normalized.statusCode) && normalized.statusCode >= 500;
}

function sslConfig(mode) {
  const normalized = String(mode || '').trim().toLowerCase();
  if (!normalized || normalized === 'disable' || normalized === 'false') {
    return undefined;
  }
  if (normalized === 'verify-full') return { rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

export function buildAnalysisSessionPostgresSchemaSql() {
  return `
CREATE TABLE IF NOT EXISTS cellcount_analysis_sessions (
  analysis_id uuid PRIMARY KEY,
  user_id varchar(160) NOT NULL,
  idempotency_key varchar(160) NOT NULL,
  status varchar(32) NOT NULL,
  session jsonb NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  schema_version integer NOT NULL DEFAULT ${POSTGRES_ANALYSIS_SESSION_SCHEMA_VERSION},
  CONSTRAINT cellcount_analysis_sessions_user_idempotency_uq
    UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS cellcount_analysis_sessions_status_idx
  ON cellcount_analysis_sessions (status);
CREATE INDEX IF NOT EXISTS cellcount_analysis_sessions_updated_at_idx
  ON cellcount_analysis_sessions (updated_at);
`;
}

export class PostgresAnalysisSessionStore {
  constructor({
    connectionString = process.env.DATABASE_URL,
    sslMode = process.env.DATABASE_SSL_MODE,
    pool = null,
    maxAttempts = DEFAULT_ANALYSIS_MAX_ATTEMPTS,
    leaseTtlMs = DEFAULT_ANALYSIS_LEASE_TTL_MS,
    sessionTtlMs = DEFAULT_ANALYSIS_SESSION_TTL_MS,
    autoMigrate = true,
  } = {}) {
    if (!pool && !connectionString) {
      throw new Error('INF-SCALE-001.1B: DATABASE_URL is required for PostgreSQL analysis-session storage.');
    }

    if (pool) {
      this.pool = pool;
    } else {
      let Pool;
      try {
        ({ Pool } = require('pg'));
      } catch (error) {
        throw new Error(
          'INF-SCALE-001.1B: pg dependency is required for PostgreSQL storage. Run npm install.',
          { cause: error },
        );
      }
      this.pool = new Pool({
        connectionString,
        ssl: sslConfig(sslMode),
        max: positiveInt(process.env.ANALYSIS_SESSION_DB_POOL_MAX, 10),
        idleTimeoutMillis: positiveInt(process.env.ANALYSIS_SESSION_DB_IDLE_TIMEOUT_MS, 30_000),
        connectionTimeoutMillis: positiveInt(process.env.ANALYSIS_SESSION_DB_CONNECTION_TIMEOUT_MS, 10_000),
      });
    }
    this.maxAttempts = positiveInt(maxAttempts, DEFAULT_ANALYSIS_MAX_ATTEMPTS);
    this.leaseTtlMs = positiveInt(leaseTtlMs, DEFAULT_ANALYSIS_LEASE_TTL_MS);
    this.sessionTtlMs = positiveInt(sessionTtlMs, DEFAULT_ANALYSIS_SESSION_TTL_MS);
    this.autoMigrate = autoMigrate;
    this._schemaReady = false;
    this._schemaPromise = null;
  }

  async ensureSchema() {
    if (this._schemaReady || !this.autoMigrate) return;
    if (!this._schemaPromise) {
      this._schemaPromise = (async () => {
        const client = await this.pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(
            'SELECT pg_advisory_xact_lock($1::bigint)',
            [ANALYSIS_SESSION_SCHEMA_ADVISORY_LOCK_KEY],
          );
          await client.query(buildAnalysisSessionPostgresSchemaSql());
          await client.query('COMMIT');
          this._schemaReady = true;
        } catch (error) {
          try {
            await client.query('ROLLBACK');
          } catch {
            // Preserve the migration error as the authoritative failure.
          }
          throw error;
        } finally {
          client.release();
        }
      })().catch((error) => {
        this._schemaPromise = null;
        throw error;
      });
    }
    await this._schemaPromise;
  }

  async close() {
    if (typeof this.pool?.end === 'function') await this.pool.end();
  }

  async createOrReuse({ userId, idempotencyKey, metadata = {} }) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    if (!normalizedKey) throw new Error('idempotencyKey is required');

    return this.#transaction(async (client) => {
      const nowMs = Date.now();
      const now = toIso(nowMs);
      const session = {
        contractVersion: ANALYSIS_SESSION_CONTRACT_VERSION,
        retryPolicyVersion: ANALYSIS_RETRY_POLICY_VERSION,
        analysisId: crypto.randomUUID(),
        userId: normalizedUserId,
        idempotencyKey: normalizedKey,
        status: ANALYSIS_SESSION_STATES.queued,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        expiredAt: null,
        attempt: 0,
        maxAttempts: this.maxAttempts,
        retryEligible: false,
        retryAfter: null,
        lastFailure: null,
        terminalReason: null,
        executionLeaseToken: null,
        executionClaimedAt: null,
        leaseExpiresAt: null,
        expiresAt: toIso(nowMs + this.sessionTtlMs),
        metadata: clone(metadata) ?? {},
        result: null,
        error: null,
      };

      const inserted = await client.query(
        `INSERT INTO cellcount_analysis_sessions
           (analysis_id, user_id, idempotency_key, status, session, created_at, updated_at, schema_version)
         VALUES ($1::uuid, $2, $3, $4, $5::jsonb, $6::timestamptz, $7::timestamptz, $8)
         ON CONFLICT (user_id, idempotency_key) DO NOTHING
         RETURNING session`,
        [session.analysisId, normalizedUserId, normalizedKey, session.status, JSON.stringify(session), now, now, POSTGRES_ANALYSIS_SESSION_SCHEMA_VERSION],
      );

      if (inserted.rows.length === 1) {
        return { session: clone(inserted.rows[0].session), reused: false };
      }

      const existingResult = await client.query(
        `SELECT session FROM cellcount_analysis_sessions
         WHERE user_id = $1 AND idempotency_key = $2
         FOR UPDATE`,
        [normalizedUserId, normalizedKey],
      );
      if (existingResult.rows.length !== 1) {
        throw new Error('INF-SCALE-001.1B: idempotency conflict could not be resolved.');
      }
      const governed = await this.#refreshLifecycle(client, existingResult.rows[0].session);
      return { session: clone(governed), reused: true };
    });
  }

  async get(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) return null;
    return this.#transaction(async (client) => {
      const session = await this.#readOwnedForUpdate(client, normalizedId, userId);
      if (!session) return null;
      return clone(await this.#refreshLifecycle(client, session));
    });
  }

  async getRecoverySnapshot(analysisId, userId) {
    const session = await this.get(analysisId, userId);
    if (!session) return null;

    let action = ANALYSIS_RECOVERY_ACTIONS.wait;
    let retryAfterMs = 3000;
    if (session.status === ANALYSIS_SESSION_STATES.completed && session.result) {
      action = ANALYSIS_RECOVERY_ACTIONS.deliverResult;
      retryAfterMs = 0;
    } else if (session.status === ANALYSIS_SESSION_STATES.retryEligible) {
      action = ANALYSIS_RECOVERY_ACTIONS.retrySameSession;
      retryAfterMs = 0;
    } else if (session.status === ANALYSIS_SESSION_STATES.expired) {
      action = ANALYSIS_RECOVERY_ACTIONS.expired;
      retryAfterMs = 0;
    } else if (session.status === ANALYSIS_SESSION_STATES.failed) {
      action = ANALYSIS_RECOVERY_ACTIONS.terminalFailure;
      retryAfterMs = 0;
    } else if (session.status === ANALYSIS_SESSION_STATES.processing) {
      const remainingLeaseMs = isoMs(session.leaseExpiresAt) == null
        ? 3000
        : Math.max(1000, isoMs(session.leaseExpiresAt) - Date.now());
      retryAfterMs = Math.min(5000, remainingLeaseMs);
    }

    return {
      orchestrationVersion: ANALYSIS_RECOVERY_ORCHESTRATION_VERSION,
      action,
      retryAfterMs,
      serverTime: new Date().toISOString(),
      analysisId: session.analysisId,
      idempotencyKey: session.idempotencyKey,
      attempt: Number(session.attempt || 0),
      maxAttempts: Number(session.maxAttempts || 0),
      session: clone(session),
    };
  }

  async findByIdempotencyKey(userId, idempotencyKey) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    if (!normalizedKey) return null;
    return this.#transaction(async (client) => {
      const result = await client.query(
        `SELECT session FROM cellcount_analysis_sessions
         WHERE user_id = $1 AND idempotency_key = $2
         FOR UPDATE`,
        [normalizedUserId, normalizedKey],
      );
      if (!result.rows.length) return null;
      return clone(await this.#refreshLifecycle(client, result.rows[0].session));
    });
  }

  async claimExecution(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) throw new Error('analysisId is required');

    return this.#transaction(async (client) => {
      let session = await this.#readOwnedForUpdate(client, normalizedId, userId);
      if (!session) throw new Error('analysis session not found');
      session = await this.#refreshLifecycle(client, session);

      if (session.status === ANALYSIS_SESSION_STATES.completed) {
        return this.#blockedClaim(ANALYSIS_EXECUTION_CLAIM_REASONS.completed, session);
      }
      if (session.status === ANALYSIS_SESSION_STATES.expired) {
        return this.#blockedClaim(ANALYSIS_EXECUTION_CLAIM_REASONS.expired, session);
      }
      if (session.status === ANALYSIS_SESSION_STATES.failed) {
        return this.#blockedClaim(
          session.terminalReason === 'MAX_ATTEMPTS_EXHAUSTED'
            ? ANALYSIS_EXECUTION_CLAIM_REASONS.maxAttempts
            : ANALYSIS_EXECUTION_CLAIM_REASONS.failed,
          session,
        );
      }
      if (session.status === ANALYSIS_SESSION_STATES.processing) {
        return this.#blockedClaim(ANALYSIS_EXECUTION_CLAIM_REASONS.inProgress, session);
      }

      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      if (Number(session.attempt || 0) >= maxAttempts) {
        session = await this.#failPermanently(client, session, 'MAX_ATTEMPTS_EXHAUSTED', 'Limite de tentativas da sessão de análise atingido.');
        return this.#blockedClaim(ANALYSIS_EXECUTION_CLAIM_REASONS.maxAttempts, session);
      }

      const nowMs = Date.now();
      const now = toIso(nowMs);
      const leaseToken = crypto.randomUUID();
      session.status = ANALYSIS_SESSION_STATES.processing;
      session.updatedAt = now;
      session.startedAt ??= now;
      session.executionClaimedAt = now;
      session.executionLeaseToken = leaseToken;
      session.leaseExpiresAt = toIso(nowMs + this.leaseTtlMs);
      session.attempt = Number(session.attempt || 0) + 1;
      session.retryEligible = false;
      session.retryAfter = null;
      session.terminalReason = null;
      session.error = null;
      await this.#persist(client, session);

      return { acquired: true, reason: ANALYSIS_EXECUTION_CLAIM_REASONS.acquired, leaseToken, session: clone(session) };
    });
  }

  async prepareRetry(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) throw new Error('analysisId is required');
    return this.#transaction(async (client) => {
      let session = await this.#readOwnedForUpdate(client, normalizedId, userId);
      if (!session) throw new Error('analysis session not found');
      session = await this.#refreshLifecycle(client, session);
      if (session.status === ANALYSIS_SESSION_STATES.retryEligible) {
        session.status = ANALYSIS_SESSION_STATES.queued;
        session.retryEligible = true;
        session.retryAfter = null;
        session.updatedAt = new Date().toISOString();
        await this.#persist(client, session);
        return { accepted: true, session: clone(session) };
      }
      return { accepted: false, session: clone(session) };
    });
  }

  async markProcessing(analysisId, userId) {
    const claim = await this.claimExecution(analysisId, userId);
    return claim.session;
  }

  async markCompleted(analysisId, userId, result, { leaseToken = null } = {}) {
    const normalizedId = safeKey(analysisId);
    return this.#transaction(async (client) => {
      let session = await this.#readOwnedForUpdate(client, normalizedId, userId);
      if (!session) throw new Error('analysis session not found');
      session = await this.#refreshLifecycle(client, session);
      if (TERMINAL.has(session.status)) return clone(session);
      this.#assertLease(session, leaseToken);
      const now = new Date().toISOString();
      session.status = ANALYSIS_SESSION_STATES.completed;
      session.updatedAt = now;
      session.executionLeaseToken = null;
      session.executionClaimedAt = null;
      session.leaseExpiresAt = null;
      session.completedAt = now;
      session.failedAt = null;
      session.result = clone(result);
      session.error = null;
      session.lastFailure = null;
      session.retryEligible = false;
      session.retryAfter = null;
      session.terminalReason = 'COMPLETED';
      await this.#persist(client, session);
      return clone(session);
    });
  }

  async markFailed(analysisId, userId, error, { leaseToken = null } = {}) {
    const normalizedId = safeKey(analysisId);
    return this.#transaction(async (client) => {
      let session = await this.#readOwnedForUpdate(client, normalizedId, userId);
      if (!session) throw new Error('analysis session not found');
      session = await this.#refreshLifecycle(client, session);
      if (TERMINAL.has(session.status)) return clone(session);
      this.#assertLease(session, leaseToken);

      const now = new Date().toISOString();
      const failure = normalizedError(error);
      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      const retryable = isRetryableFailure(failure) && Number(session.attempt || 0) < maxAttempts && !this.#isSessionExpired(session);
      session.updatedAt = now;
      session.failedAt = now;
      session.executionLeaseToken = null;
      session.executionClaimedAt = null;
      session.leaseExpiresAt = null;
      session.lastFailure = failure;
      session.error = failure;
      session.result = null;
      if (retryable) {
        session.status = ANALYSIS_SESSION_STATES.retryEligible;
        session.retryEligible = true;
        session.retryAfter = now;
        session.terminalReason = null;
      } else {
        session.status = ANALYSIS_SESSION_STATES.failed;
        session.retryEligible = false;
        session.retryAfter = null;
        session.terminalReason = Number(session.attempt || 0) >= maxAttempts ? 'MAX_ATTEMPTS_EXHAUSTED' : 'NON_RETRYABLE_FAILURE';
      }
      await this.#persist(client, session);
      return clone(session);
    });
  }

  #assertLease(session, leaseToken) {
    if (leaseToken && session.executionLeaseToken && leaseToken !== session.executionLeaseToken) {
      throw new Error('analysis execution lease mismatch');
    }
  }

  #blockedClaim(reason, session) {
    return { acquired: false, reason, leaseToken: null, session: clone(session) };
  }

  #isSessionExpired(session, nowMs = Date.now()) {
    const expiresAtMs = isoMs(session.expiresAt);
    if (session.status === ANALYSIS_SESSION_STATES.processing || session.status === ANALYSIS_SESSION_STATES.completed) return false;
    return expiresAtMs !== null && nowMs >= expiresAtMs;
  }

  async #refreshLifecycle(client, session) {
    const nowMs = Date.now();
    if (session.status === ANALYSIS_SESSION_STATES.processing && isoMs(session.leaseExpiresAt) !== null && nowMs >= isoMs(session.leaseExpiresAt)) {
      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      const failure = normalizedError({
        code: 'ORPHANED_EXECUTION_LEASE_EXPIRED',
        message: 'A execução anterior perdeu o lease antes de concluir. A sessão pode ser retomada com segurança.',
        statusCode: 408,
      });
      session.executionLeaseToken = null;
      session.executionClaimedAt = null;
      session.leaseExpiresAt = null;
      session.lastFailure = failure;
      session.error = failure;
      session.failedAt = new Date().toISOString();
      if (Number(session.attempt || 0) < maxAttempts) {
        session.status = ANALYSIS_SESSION_STATES.retryEligible;
        session.retryEligible = true;
        session.retryAfter = new Date().toISOString();
        session.terminalReason = null;
      } else {
        session.status = ANALYSIS_SESSION_STATES.failed;
        session.retryEligible = false;
        session.retryAfter = null;
        session.terminalReason = 'MAX_ATTEMPTS_EXHAUSTED';
      }
      session.updatedAt = new Date().toISOString();
      await this.#persist(client, session);
    }

    if (this.#isSessionExpired(session, nowMs)) {
      session.status = ANALYSIS_SESSION_STATES.expired;
      session.updatedAt = new Date().toISOString();
      session.expiredAt = session.updatedAt;
      session.retryEligible = false;
      session.retryAfter = null;
      session.executionLeaseToken = null;
      session.executionClaimedAt = null;
      session.leaseExpiresAt = null;
      session.terminalReason = 'SESSION_TTL_EXPIRED';
      await this.#persist(client, session);
    }
    return session;
  }

  async #failPermanently(client, session, code, message) {
    const now = new Date().toISOString();
    const failure = normalizedError({ code, message, statusCode: 409 });
    session.status = ANALYSIS_SESSION_STATES.failed;
    session.updatedAt = now;
    session.failedAt = now;
    session.retryEligible = false;
    session.retryAfter = null;
    session.executionLeaseToken = null;
    session.executionClaimedAt = null;
    session.leaseExpiresAt = null;
    session.lastFailure = failure;
    session.error = failure;
    session.terminalReason = code;
    await this.#persist(client, session);
    return session;
  }

  async #readOwnedForUpdate(client, analysisId, userId) {
    if (!analysisId) return null;
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const result = await client.query(
      `SELECT session FROM cellcount_analysis_sessions
       WHERE analysis_id = $1::uuid AND user_id = $2
       FOR UPDATE`,
      [analysisId, normalizedUserId],
    );
    return result.rows.length ? result.rows[0].session : null;
  }

  async #persist(client, session) {
    const result = await client.query(
      `UPDATE cellcount_analysis_sessions
       SET status = $2, session = $3::jsonb, updated_at = $4::timestamptz, schema_version = $5
       WHERE analysis_id = $1::uuid`,
      [session.analysisId, session.status, JSON.stringify(session), session.updatedAt, POSTGRES_ANALYSIS_SESSION_SCHEMA_VERSION],
    );
    if (result.rowCount !== 1) throw new Error('INF-SCALE-001.1B: analysis session update lost.');
  }

  async #transaction(work) {
    await this.ensureSchema();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch (_) { /* preserve original error */ }
      throw error;
    } finally {
      client.release();
    }
  }
}
