import { randomUUID } from 'crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'fs/promises';
import path from 'path';

export const ANALYSIS_SESSION_CONTRACT_VERSION = 'BE/FE-FIX-006.1';
export const ANALYSIS_SESSION_STATES = Object.freeze({
  queued: 'QUEUED',
  processing: 'PROCESSING',
  completed: 'COMPLETED',
  failed: 'FAILED',
});

const TERMINAL = new Set([
  ANALYSIS_SESSION_STATES.completed,
  ANALYSIS_SESSION_STATES.failed,
]);

function safeKey(value) {
  return String(value ?? '').trim().replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 160);
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export class AnalysisSessionStore {
  constructor({ rootDir = path.join(process.cwd(), 'data', 'analysis-sessions') } = {}) {
    this.rootDir = rootDir;
  }

  async createOrReuse({ userId, idempotencyKey, metadata = {} }) {
    const normalizedUserId = safeKey(userId || 'anonymous_device');
    const normalizedKey = safeKey(idempotencyKey);
    if (!normalizedKey) {
      throw new Error('idempotencyKey is required');
    }

    await mkdir(this.rootDir, { recursive: true });
    const existing = await this.findByIdempotencyKey(normalizedUserId, normalizedKey);
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
      metadata: clone(metadata) ?? {},
      result: null,
      error: null,
    };

    await this.#write(session);
    return { session: clone(session), reused: false };
  }

  async get(analysisId, userId) {
    const session = await this.#read(analysisId);
    if (!session) return null;
    if (safeKey(session.userId) !== safeKey(userId || 'anonymous_device')) return null;
    return clone(session);
  }

  async findByIdempotencyKey(userId, idempotencyKey) {
    await mkdir(this.rootDir, { recursive: true });
    const files = await readdir(this.rootDir).catch(() => []);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const session = await this.#read(file.slice(0, -5));
      if (!session) continue;
      if (session.userId === userId && session.idempotencyKey === idempotencyKey) {
        return clone(session);
      }
    }
    return null;
  }

  async markProcessing(analysisId, userId) {
    return this.#transition(analysisId, userId, ANALYSIS_SESSION_STATES.processing, (session, now) => {
      session.startedAt ??= now;
      session.attempt = Number(session.attempt || 0) + 1;
      session.error = null;
    });
  }

  async markCompleted(analysisId, userId, result) {
    return this.#transition(analysisId, userId, ANALYSIS_SESSION_STATES.completed, (session, now) => {
      session.completedAt = now;
      session.failedAt = null;
      session.result = clone(result);
      session.error = null;
    });
  }

  async markFailed(analysisId, userId, error) {
    return this.#transition(analysisId, userId, ANALYSIS_SESSION_STATES.failed, (session, now) => {
      session.failedAt = now;
      session.completedAt = null;
      session.error = {
        code: String(error?.code || 'ANALYSIS_FAILED'),
        message: String(error?.message || error || 'Analysis failed'),
        statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
      };
    });
  }

  async #transition(analysisId, userId, nextStatus, mutate) {
    const session = await this.get(analysisId, userId);
    if (!session) throw new Error('analysis session not found');

    if (TERMINAL.has(session.status) && session.status !== nextStatus) {
      return session;
    }

    const now = new Date().toISOString();
    session.status = nextStatus;
    session.updatedAt = now;
    mutate?.(session, now);
    await this.#write(session);
    return clone(session);
  }

  async #read(analysisId) {
    const id = safeKey(analysisId);
    if (!id) return null;
    try {
      return JSON.parse(await readFile(path.join(this.rootDir, `${id}.json`), 'utf8'));
    } catch {
      return null;
    }
  }

  async #write(session) {
    await mkdir(this.rootDir, { recursive: true });
    const target = path.join(this.rootDir, `${safeKey(session.analysisId)}.json`);
    const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(temp, JSON.stringify(session, null, 2), 'utf8');
    await rename(temp, target);
  }
}
