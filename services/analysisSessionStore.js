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

export const ANALYSIS_SESSION_CONTRACT_VERSION = 'BE/FE-FIX-006.2';

export const ANALYSIS_SESSION_STATES = Object.freeze({
  queued: 'QUEUED',
  processing: 'PROCESSING',
  completed: 'COMPLETED',
  failed: 'FAILED',
});

export const ANALYSIS_EXECUTION_CLAIM_REASONS = Object.freeze({
  acquired: 'ACQUIRED',
  inProgress: 'IN_PROGRESS',
  completed: 'COMPLETED',
  failed: 'FAILED',
});

const TERMINAL = new Set([
  ANALYSIS_SESSION_STATES.completed,
  ANALYSIS_SESSION_STATES.failed,
]);

const LOCK_RETRY_DELAY_MS = 20;
const LOCK_RETRY_LIMIT = 75;
const STALE_LOCK_MS = 10_000;

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

export class AnalysisSessionStore {
  constructor({
    rootDir = path.join(process.cwd(), 'data', 'analysis-sessions'),
  } = {}) {
    this.rootDir = rootDir;
  }

  async createOrReuse({ userId, idempotencyKey, metadata = {} }) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    if (!normalizedKey) {
      throw new Error('idempotencyKey is required');
    }

    await mkdir(this.rootDir, { recursive: true });

    // A global idempotency lock prevents two simultaneous creates with the
    // same key from generating different analysisIds.
    const lockKey = `idempotency-${normalizedUserId}-${normalizedKey}`;
    return this.#withLock(lockKey, async () => {
      const existing = await this.findByIdempotencyKey(
        normalizedUserId,
        normalizedKey,
      );
      if (existing) {
        return { session: existing, reused: true };
      }

      const now = new Date().toISOString();
      const session = {
        contractVersion: ANALYSIS_SESSION_CONTRACT_VERSION,
        analysisId: randomUUID(),
        userId: normalizedUserId,
        idempotencyKey: normalizedKey,
        status: ANALYSIS_SESSION_STATES.queued,
        createdAt: now,
        updatedAt: now,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        attempt: 0,
        executionLeaseToken: null,
        executionClaimedAt: null,
        metadata: clone(metadata) ?? {},
        result: null,
        error: null,
      };

      await this.#write(session);
      return { session: clone(session), reused: false };
    });
  }

  async get(analysisId, userId) {
    const session = await this.#read(analysisId);
    if (!session) return null;
    if (
      safeKey(session.userId) !==
      safeKey(userId || 'anonymous_device')
    ) {
      return null;
    }
    return clone(session);
  }

  async findByIdempotencyKey(userId, idempotencyKey) {
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
        return clone(session);
      }
    }
    return null;
  }

  /// BE/FE-FIX-006.2 — exactly-one execution claim.
  ///
  /// The claim is serialized with an atomic filesystem lock. A duplicate
  /// request for the same analysisId can observe PROCESSING/COMPLETED/FAILED,
  /// but cannot increment `attempt` or start a second expensive AI execution.
  async claimExecution(analysisId, userId) {
    const normalizedId = safeKey(analysisId);
    if (!normalizedId) {
      throw new Error('analysisId is required');
    }

    return this.#withLock(`analysis-${normalizedId}`, async () => {
      const session = await this.get(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      if (session.status === ANALYSIS_SESSION_STATES.completed) {
        return {
          acquired: false,
          reason: ANALYSIS_EXECUTION_CLAIM_REASONS.completed,
          leaseToken: null,
          session,
        };
      }

      if (session.status === ANALYSIS_SESSION_STATES.failed) {
        return {
          acquired: false,
          reason: ANALYSIS_EXECUTION_CLAIM_REASONS.failed,
          leaseToken: null,
          session,
        };
      }

      if (session.status === ANALYSIS_SESSION_STATES.processing) {
        return {
          acquired: false,
          reason: ANALYSIS_EXECUTION_CLAIM_REASONS.inProgress,
          leaseToken: null,
          session,
        };
      }

      const now = new Date().toISOString();
      const leaseToken = randomUUID();

      session.status = ANALYSIS_SESSION_STATES.processing;
      session.updatedAt = now;
      session.startedAt ??= now;
      session.executionClaimedAt = now;
      session.executionLeaseToken = leaseToken;
      session.attempt = Number(session.attempt || 0) + 1;
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

  // Compatibility bridge retained for 006.1 callers/tests.
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
      (session, now) => {
        session.completedAt = now;
        session.failedAt = null;
        session.result = clone(result);
        session.error = null;
      },
    );
  }

  async markFailed(
    analysisId,
    userId,
    error,
    { leaseToken = null } = {},
  ) {
    return this.#finishExecution(
      analysisId,
      userId,
      ANALYSIS_SESSION_STATES.failed,
      leaseToken,
      (session, now) => {
        session.failedAt = now;
        session.completedAt = null;
        session.error = {
          code: String(error?.code || 'ANALYSIS_FAILED'),
          message: String(error?.message || error || 'Analysis failed'),
          statusCode: Number.isInteger(error?.statusCode)
            ? error.statusCode
            : null,
        };
      },
    );
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
      const session = await this.get(normalizedId, userId);
      if (!session) {
        throw new Error('analysis session not found');
      }

      if (TERMINAL.has(session.status)) {
        return session;
      }

      if (
        leaseToken &&
        session.executionLeaseToken &&
        leaseToken !== session.executionLeaseToken
      ) {
        throw new Error('analysis execution lease mismatch');
      }

      const now = new Date().toISOString();
      session.status = nextStatus;
      session.updatedAt = now;
      session.executionLeaseToken = null;
      mutate?.(session, now);
      await this.#write(session);
      return clone(session);
    });
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

        // Lock files are held only for tiny local state transitions. A very old
        // file is therefore an orphan from a crashed process and may be removed.
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
