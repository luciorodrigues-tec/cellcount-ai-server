import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ANALYSIS_SESSION_CONTRACT_VERSION,
  AnalysisSessionStore,
} from '../services/analysisSessionStore.js';

test('006.1 creates durable queued session and reuses idempotency key', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cellcount-0061-'));
  try {
    const store = new AnalysisSessionStore({ rootDir: root });
    const first = await store.createOrReuse({ userId: 'u1', idempotencyKey: 'k1' });
    const second = await store.createOrReuse({ userId: 'u1', idempotencyKey: 'k1' });
    assert.equal(first.reused, false);
    assert.equal(second.reused, true);
    assert.equal(first.session.analysisId, second.session.analysisId);
    assert.equal(first.session.status, 'QUEUED');
    assert.equal(first.session.contractVersion, ANALYSIS_SESSION_CONTRACT_VERSION);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('006.1 persists PROCESSING then COMPLETED result', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cellcount-0061-'));
  try {
    const store = new AnalysisSessionStore({ rootDir: root });
    const { session } = await store.createOrReuse({ userId: 'u1', idempotencyKey: 'k2' });
    await store.markProcessing(session.analysisId, 'u1');
    await store.markCompleted(session.analysisId, 'u1', { success: true, analysis: { summary: 'ok' } });
    const loaded = await store.get(session.analysisId, 'u1');
    assert.equal(loaded.status, 'COMPLETED');
    assert.equal(loaded.result.analysis.summary, 'ok');
    assert.equal(loaded.attempt, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
