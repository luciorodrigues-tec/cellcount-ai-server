import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ANALYSIS_SESSION_CONTRACT_VERSION,
  ANALYSIS_SESSION_STATES,
  AnalysisSessionStore,
} from '../services/analysisSessionStore.js';

async function withStore(fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cellcount-0062-'));
  try {
    await fn(new AnalysisSessionStore({ rootDir: root }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('006.2 concurrent claims allow exactly one execution', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u1',
      idempotencyKey: 'same-request',
    });

    const [a, b] = await Promise.all([
      store.claimExecution(created.session.analysisId, 'u1'),
      store.claimExecution(created.session.analysisId, 'u1'),
    ]);

    const acquired = [a, b].filter((item) => item.acquired);
    const blocked = [a, b].filter((item) => !item.acquired);

    assert.equal(ANALYSIS_SESSION_CONTRACT_VERSION, 'BE/FE-FIX-006.2');
    assert.equal(acquired.length, 1);
    assert.equal(blocked.length, 1);
    assert.equal(acquired[0].session.status, ANALYSIS_SESSION_STATES.processing);
    assert.equal(acquired[0].session.attempt, 1);
    assert.equal(blocked[0].reason, 'IN_PROGRESS');
    assert.equal(blocked[0].session.attempt, 1);
  });
});

test('006.2 duplicate idempotency create returns the same analysisId', async () => {
  await withStore(async (store) => {
    const [a, b] = await Promise.all([
      store.createOrReuse({
        userId: 'u2',
        idempotencyKey: 'idem-42',
      }),
      store.createOrReuse({
        userId: 'u2',
        idempotencyKey: 'idem-42',
      }),
    ]);

    assert.equal(a.session.analysisId, b.session.analysisId);
    assert.equal([a.reused, b.reused].filter(Boolean).length, 1);
  });
});

test('006.2 completed session cannot be executed again', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u3',
      idempotencyKey: 'done-1',
    });
    const claim = await store.claimExecution(created.session.analysisId, 'u3');

    await store.markCompleted(
      created.session.analysisId,
      'u3',
      { success: true, analysis: { sentinel: 'original-result' } },
      { leaseToken: claim.leaseToken },
    );

    const duplicate = await store.claimExecution(
      created.session.analysisId,
      'u3',
    );

    assert.equal(duplicate.acquired, false);
    assert.equal(duplicate.reason, 'COMPLETED');
    assert.equal(
      duplicate.session.result.analysis.sentinel,
      'original-result',
    );
    assert.equal(duplicate.session.attempt, 1);
  });
});

test('006.2 stale/wrong execution lease cannot overwrite active execution', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u4',
      idempotencyKey: 'lease-1',
    });
    await store.claimExecution(created.session.analysisId, 'u4');

    await assert.rejects(
      store.markCompleted(
        created.session.analysisId,
        'u4',
        { success: true },
        { leaseToken: 'wrong-lease' },
      ),
      /lease mismatch/,
    );

    const current = await store.get(created.session.analysisId, 'u4');
    assert.equal(current.status, ANALYSIS_SESSION_STATES.processing);
  });
});
