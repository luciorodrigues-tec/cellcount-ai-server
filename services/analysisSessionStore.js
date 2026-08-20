import { randomUUID } from 'crypto';
import {
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from 'fs/promises';
import path from 'path';

export const ANALYSIS_SESSION_CONTRACT_VERSION = 'BE/FE-FIX-006.5';

export const ANALYSIS_SESSION_STATES = Object.freeze({
  queued: 'QUEUED',
  processing: 'PROCESSING',
  retryEligible: 'RETRY_ELIGIBLE',
  completed: 'COMPLETED',
  failed: 'FAILED',
  expired: 'EXPIRED',
});

export const ANALYSIS_EXECUTION_CLAIM_REASONS = Object.freeze({
  acquired: 'ACQUIRED',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  retryEligible: 'RETRY_ELIGIBLE',
  failed: 'FAILED',
  expired: 'EXPIRED',
  maxAttempts: 'MAX_ATTEMPTS_EXHAUSTED',
});

export const ANALYSIS_RETRY_POLICY_VERSION = 'BE/FE-FIX-006.5';
export const DEFAULT_ANALYSIS_MAX_ATTEMPTS = Number(
  process.env.ANALYSIS_SESSION_MAX_ATTEMPTS || 3,
);
export const DEFAULT_ANALYSIS_LEASE_TTL_MS = Number(
  process.env.ANALYSIS_SESSION_LEASE_TTL_MS || 15 * 60 * 1000,
);
export const DEFAULT_ANALYSIS_SESSION_TTL_MS = Number(
  process.env.ANALYSIS_SESSION_TTL_MS || 24 * 60 * 60 * 1000,
);

const TERMINAL = new Set([
  ANALYSIS_SESSION_STATES.completed,
  ANALYSIS_SESSION_STATES.failed,
  ANALYSIS_SESSION_STATES.expired,
]);

const LOCK_RETRY_DELAY_MS = 20;
const LOCK_RETRY_LIMIT = 75;
const STALE_LOCK_MS = 10_000;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    statusCode: Number.isInteger(error?.statusCode)
      ? error.statusCode
      : null,
    occurredAt: new Date().toISOString(),
  };
}

function isRetryableFailure(error) {
  const normalized = normalizedError(error);
  if (RETRYABLE_ERROR_CODES.has(normalized.code)) return true;
  if (normalized.statusCode === 408 || normalized.statusCode === 429) return true;
  if (
    Number.isInteger(normalized.statusCode) &&
    normalized.statusCode >= 500
  ) {
    return true;
  }
  return false;
}

export class AnalysisSessionStore {
  constructor({
    rootDir = path.join(process.cwd(), 'data', 'analysis-sessions'),
    maxAttempts = DEFAULT_ANALYSIS_MAX_ATTEMPTS,
    leaseTtlMs = DEFAULT_ANALYSIS_LEASE_TTL_MS,
    sessionTtlMs = DEFAULT_ANALYSIS_SESSION_TTL_MS,
  } = {}) {
    this.rootDir = rootDir;
    this.maxAttempts = positiveInt(
      maxAttempts,
      DEFAULT_ANALYSIS_MAX_ATTEMPTS,
    );
    this.leaseTtlMs = positiveInt(
      leaseTtlMs,
      DEFAULT_ANALYSIS_LEASE_TTL_MS,
    );
    this.sessionTtlMs = positiveInt(
      sessionTtlMs,
      DEFAULT_ANALYSIS_SESSION_TTL_MS,
    );
  }

  async createOrReuse({ userId, idempotencyKey, metadata = {} }) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    if (!normalizedKey) {
      throw new Error('idempotencyKey is required');
    }

    await mkdir(this.rootDir, { recursive: true });
    const lockKey = `idempotency-${normalizedUserId}-${normalizedKey}`;

    return this.#withLock(lockKey, async () => {
      const existing = await this.#findByIdempotencyKeyUnlocked(
        normalizedUserId,
        normalizedKey,
      );

      if (existing) {
        const governed = await this.#refreshLifecycle(existing);
        return { session: clone(governed), reused: true };
      }

      const nowMs = Date.now();
      const now = toIso(nowMs);
      const session = {
        contractVersion: ANALYSIS_SESSION_CONTRACT_VERSION,
        retryPolicyVersion: ANALYSIS_RETRY_POLICY_VERSION,
        analysisId: randomUUID(),
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

      await this.#write(session);
      return { session: clone(session), reused: false };
    });
  }

  async get(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) return null;

    return this.#withLock(`analysis-${normalizedId}`, async () => {
      const session = await this.#readOwned(normalizedId, userId);
      if (!session) return null;
      return clone(await this.#refreshLifecycle(session));
    });
  }

  async findByIdempotencyKey(userId, idempotencyKey) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    const session = await this.#findByIdempotencyKeyUnlocked(
      normalizedUserId,
      normalizedKey,
    );
    if (!session) return null;
    return clone(await this.#refreshLifecycle(session));
  }

  async claimExecution(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) {
      throw new Error('analysisId is required');
    }

    return this.#withLock(`analysis-${normalizedId}`, async () => {
      let session = await this.#readOwned(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      session = await this.#refreshLifecycle(session);

      if (session.status === ANALYSIS_SESSION_STATES.completed) {
        return this.#blockedClaim(
          ANALYSIS_EXECUTION_CLAIM_REASONS.completed,
          session,
        );
      }

      if (session.status === ANALYSIS_SESSION_STATES.expired) {
        return this.#blockedClaim(
          ANALYSIS_EXECUTION_CLAIM_REASONS.expired,
          session,
        );
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
        return this.#blockedClaim(
          ANALYSIS_EXECUTION_CLAIM_REASONS.inProgress,
          session,
        );
      }

      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      if (Number(session.attempt || 0) >= maxAttempts) {
        session = await this.#failPermanently(
          session,
          'MAX_ATTEMPTS_EXHAUSTED',
          'Limite de tentativas da sessão de análise atingido.',
        );
        return this.#blockedClaim(
          ANALYSIS_EXECUTION_CLAIM_REASONS.maxAttempts,
          session,
        );
      }

      const nowMs = Date.now();
      const now = toIso(nowMs);
      const leaseToken = randomUUID();

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

      await this.#write(session);

      return {
        acquired: true,
        reason: ANALYSIS_EXECUTION_CLAIM_REASONS.acquired,
        leaseToken,
        session: clone(session),
      };
    });
  }

  async prepareRetry(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) {
      throw new Error('analysisId is required');
    }

    return this.#withLock(`analysis-${normalizedId}`, async () => {
      let session = await this.#readOwned(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      session = await this.#refreshLifecycle(session);

      if (session.status === ANALYSIS_SESSION_STATES.retryEligible) {
        session.status = ANALYSIS_SESSION_STATES.queued;
        session.retryEligible = true;
        session.retryAfter = null;
        session.updatedAt = new Date().toISOString();
        await this.#write(session);
        return {
          accepted: true,
          session: clone(session),
        };
      }

      return {
        accepted: false,
        session: clone(session),
      };
    });
  }

  // Compatibility bridge retained for 006.1/006.2 callers/tests.
  async markProcessing(analysisId, userId) {
    const claim = await this.claimExecution(analysisId, userId);
    return claim.session;
  }

  async markCompleted(
    analysisId,
    userId,
    result,
    { leaseToken = null } = {},
  ) {
    return this.#finishExecution(
      analysisId,
      userId,
      ANALYSIS_SESSION_STATES.completed,
      leaseToken,
      async (session, now) => {
        session.completedAt = now;
        session.failedAt = null;
        session.result = clone(result);
        session.error = null;
        session.lastFailure = null;
        session.retryEligible = false;
        session.retryAfter = null;
        session.terminalReason = 'COMPLETED';
      },
    );
  }

  async markFailed(
    analysisId,
    userId,
    error,
    { leaseToken = null } = {},
  ) {
    const normalizedId = safeKey(analysisId);
    return this.#withLock(`analysis-${normalizedId}`, async () => {
      let session = await this.#readOwned(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      session = await this.#refreshLifecycle(session);

      if (TERMINAL.has(session.status)) {
        return clone(session);
      }

      this.#assertLease(session, leaseToken);

      const now = new Date().toISOString();
      const failure = normalizedError(error);
      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      const retryable =
        isRetryableFailure(failure) &&
        Number(session.attempt || 0) < maxAttempts &&
        !this.#isSessionExpired(session);

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
        session.terminalReason =
          Number(session.attempt || 0) >= maxAttempts
            ? 'MAX_ATTEMPTS_EXHAUSTED'
            : 'NON_RETRYABLE_FAILURE';
      }

      await this.#write(session);
      return clone(session);
    });
  }

  async #finishExecution(
    analysisId,
    userId,
    nextStatus,
    leaseToken,
    mutate,
  ) {
    const normalizedId = safeKey(analysisId);
    return this.#withLock(`analysis-${normalizedId}`, async () => {
      let session = await this.#readOwned(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      session = await this.#refreshLifecycle(session);

      if (TERMINAL.has(session.status)) {
        return clone(session);
      }

      this.#assertLease(session, leaseToken);

      const now = new Date().toISOString();
      session.status = nextStatus;
      session.updatedAt = now;
      session.executionLeaseToken = null;
      session.executionClaimedAt = null;
      session.leaseExpiresAt = null;
      await mutate?.(session, now);
      await this.#write(session);
      return clone(session);
    });
  }

  #assertLease(session, leaseToken) {
    if (
      leaseToken &&
      session.executionLeaseToken &&
      leaseToken !== session.executionLeaseToken
    ) {
      throw new Error('analysis execution lease mismatch');
    }
  }

  #blockedClaim(reason, session) {
    return {
      acquired: false,
      reason,
      leaseToken: null,
      session: clone(session),
    };
  }

  #isSessionExpired(session, nowMs = Date.now()) {
    const expiresAtMs = isoMs(session.expiresAt);
    return (
      expiresAtMs !== null &&
      nowMs >= expiresAtMs &&
      session.status !== ANALYSIS_SESSION_STATES.completed
    );
  }

  async #refreshLifecycle(session) {
    const nowMs = Date.now();

    if (
      session.status === ANALYSIS_SESSION_STATES.processing &&
      isoMs(session.leaseExpiresAt) !== null &&
      nowMs >= isoMs(session.leaseExpiresAt)
    ) {
      const maxAttempts = positiveInt(session.maxAttempts, this.maxAttempts);
      const failure = normalizedError({
        code: 'ORPHANED_EXECUTION_LEASE_EXPIRED',
        message:
          'A execução anterior perdeu o lease antes de concluir. A sessão pode ser retomada com segurança.',
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
      await this.#write(session);
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
      await this.#write(session);
    }

    return session;
  }

  async #failPermanently(session, code, message) {
    const now = new Date().toISOString();
    const failure = normalizedError({
      code,
      message,
      statusCode: 409,
    });
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
    await this.#write(session);
    return session;
  }

  async #readOwned(analysisId, userId) {
    const session = await this.#read(analysisId);
    if (!session) return null;
    if (
      safeKey(session.userId) !==
      safeKey(userId || 'anonymous_device')
    ) {
      return null;
    }
    return session;
  }

  async #findByIdempotencyKeyUnlocked(userId, idempotencyKey) {
    await mkdir(this.rootDir, { recursive: true });
    const files = await readdir(this.rootDir).catch(() => []);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const session = await this.#read(file.slice(0, -5));
      if (!session) continue;
      if (
        session.userId === userId &&
        session.idempotencyKey === idempotencyKey
      ) {
        return session;
      }
    }
    return null;
  }

  async #read(analysisId) {
    const id = safeKey(analysisId);
    if (!id) return null;
    try {
      return JSON.parse(
        await readFile(path.join(this.rootDir, `${id}.json`), 'utf8'),
      );
    } catch {
      return null;
    }
  }

  async #write(session) {
    await mkdir(this.rootDir, { recursive: true });
    session.contractVersion = ANALYSIS_SESSION_CONTRACT_VERSION;
    session.retryPolicyVersion = ANALYSIS_RETRY_POLICY_VERSION;

    const target = path.join(
      this.rootDir,
      `${safeKey(session.analysisId)}.json`,
    );
    const temp = `${target}.${process.pid}.${Date.now()}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(session, null, 2), 'utf8');
    await rename(temp, target);
  }

  async #withLock(key, work) {
    await mkdir(this.rootDir, { recursive: true });
    const lockPath = path.join(this.rootDir, `.${safeKey(key)}.lock`);

    let handle = null;
    for (let attempt = 0; attempt < LOCK_RETRY_LIMIT; attempt += 1) {
      try {
        handle = await open(lockPath, 'wx');
        await handle.writeFile(
          JSON.stringify({
            pid: process.pid,
            createdAt: new Date().toISOString(),
          }),
          'utf8',
        );
        break;
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;

        try {
          const info = await stat(lockPath);
          if (Date.now() - info.mtimeMs > STALE_LOCK_MS) {
            await unlink(lockPath).catch(() => {});
            continue;
          }
        } catch {
          continue;
        }

        await sleep(LOCK_RETRY_DELAY_MS);
      }
    }

    if (!handle) {
      throw new Error('analysis session lock timeout');
    }

    try {
      return await work();
    } finally {
      await handle.close().catch(() => {});
      await unlink(lockPath).catch(() => {});
    }
  }
}
