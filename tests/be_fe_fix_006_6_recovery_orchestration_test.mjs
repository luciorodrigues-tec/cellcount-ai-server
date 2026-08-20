import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ANALYSIS_RECOVERY_ORCHESTRATION_VERSION,
  ANALYSIS_SESSION_CONTRACT_VERSION,
  AnalysisSessionStore,
} from '../services/analysisSessionStore.js';

async function fixture(options, fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cellcount-0066-'));
  try {
    await fn(new AnalysisSessionStore({ rootDir: root, ...options }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('006.6 WAIT snapshot never creates another analysisId', async () => {
  await fixture({}, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u1',
      idempotencyKey: 'recovery-wait',
    });
    const claim = await store.claimExecution(created.session.analysisId, 'u1');

    const snapshot = await store.getRecoverySnapshot(
      created.session.analysisId,
      'u1',
    );

    assert.equal(ANALYSIS_SESSION_CONTRACT_VERSION, 'BE/FE-FIX-006.6');
    assert.equal(
      ANALYSIS_RECOVERY_ORCHESTRATION_VERSION,
      'BE/FE-FIX-006.6',
    );
    assert.equal(snapshot.action, 'WAIT');
    assert.equal(snapshot.analysisId, created.session.analysisId);
    assert.equal(snapshot.session.attempt, 1);
    assert.equal(snapshot.session.executionLeaseToken, claim.leaseToken);
  });
});

test('006.6 COMPLETED snapshot delivers authoritative persisted result', async () => {
  await fixture({}, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u2',
      idempotencyKey: 'recovery-completed',
    });
    const claim = await store.claimExecution(created.session.analysisId, 'u2');

    await store.markCompleted(
      created.session.analysisId,
      'u2',
      { success: true, sentinel: 'authoritative-0066' },
      { leaseToken: claim.leaseToken },
    );

    const snapshot = await store.getRecoverySnapshot(
      created.session.analysisId,
      'u2',
    );

    assert.equal(snapshot.action, 'DELIVER_RESULT');
    assert.equal(snapshot.retryAfterMs, 0);
    assert.equal(snapshot.session.result.sentinel, 'authoritative-0066');
  });
});

test('006.6 orphaned lease becomes RETRY_SAME_SESSION, preserving analysisId', async () => {
  await fixture({ leaseTtlMs: 20, maxAttempts: 3 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u3',
      idempotencyKey: 'recovery-orphan',
    });
    await store.claimExecution(created.session.analysisId, 'u3');

    await new Promise((resolve) => setTimeout(resolve, 35));

    const snapshot = await store.getRecoverySnapshot(
      created.session.analysisId,
      'u3',
    );

    assert.equal(snapshot.action, 'RETRY_SAME_SESSION');
    assert.equal(snapshot.analysisId, created.session.analysisId);
    assert.equal(snapshot.session.retryEligible, true);
  });
});

test('006.6 recovery snapshot never mutates attempt count while polling', async () => {
  await fixture({}, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u4',
      idempotencyKey: 'recovery-read-only',
    });
    const claim = await store.claimExecution(created.session.analysisId, 'u4');

    for (let index = 0; index < 5; index += 1) {
      const snapshot = await store.getRecoverySnapshot(
        created.session.analysisId,
        'u4',
      );
      assert.equal(snapshot.action, 'WAIT');
      assert.equal(snapshot.session.attempt, 1);
      assert.equal(snapshot.session.executionLeaseToken, claim.leaseToken);
    }
  });
});

test('006.6 active PROCESSING lease outranks session TTL until execution finishes', async () => {
  await fixture(
    { sessionTtlMs: 20, leaseTtlMs: 250, maxAttempts: 3 },
    async (store) => {
      const created = await store.createOrReuse({
        userId: 'u-active-ttl',
        idempotencyKey: 'active-ttl-does-not-expire',
      });
      const claim = await store.claimExecution(
        created.session.analysisId,
        'u-active-ttl',
      );

      await new Promise((resolve) => setTimeout(resolve, 35));

      const duringExecution = await store.get(
        created.session.analysisId,
        'u-active-ttl',
      );
      assert.equal(duringExecution.status, 'PROCESSING');

      const completed = await store.markCompleted(
        created.session.analysisId,
        'u-active-ttl',
        { success: true, sentinel: 'lease-wins-over-session-ttl' },
        { leaseToken: claim.leaseToken },
      );

      assert.equal(completed.status, 'COMPLETED');
      assert.equal(
        completed.result.sentinel,
        'lease-wins-over-session-ttl',
      );
    },
  );
});
