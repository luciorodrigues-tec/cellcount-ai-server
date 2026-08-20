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

const MINIMUM_COMPATIBLE_CONTRACT_MINOR = 2;

function assertCompatible0062Contract(version) {
  const match = /^BE\/FE-FIX-006\.(\d+)$/.exec(String(version || ''));

  assert.ok(
    match,
    `Unexpected analysis-session contract version: ${version}`,
  );

  const minor = Number(match[1]);

  assert.ok(
    Number.isInteger(minor) &&
      minor >= MINIMUM_COMPATIBLE_CONTRACT_MINOR,
    `Expected BE/FE-FIX-006.${MINIMUM_COMPATIBLE_CONTRACT_MINOR}+ compatibility, got ${version}`,
  );
}

async function withStore(fn) {
  const root = await mkdtemp(
    path.join(os.tmpdir(), 'cellcount-0062-'),
  );

  try {
    await fn(
      new AnalysisSessionStore({
        rootDir: root,
      }),
    );
  } finally {
    await rm(root, {
      recursive: true,
      force: true,
    });
  }
}

test('006.2 concurrent claims allow exactly one execution', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u1',
      idempotencyKey: 'same-request',
    });

    const [a, b] = await Promise.all([
      store.claimExecution(
        created.session.analysisId,
        'u1',
      ),
      store.claimExecution(
        created.session.analysisId,
        'u1',
      ),
    ]);

    const claims = [a, b];
    const acquired = claims.filter(
      (item) => item.acquired === true,
    );
    const blocked = claims.filter(
      (item) => item.acquired !== true,
    );

    assertCompatible0062Contract(
      ANALYSIS_SESSION_CONTRACT_VERSION,
    );

    assert.equal(
      acquired.length,
      1,
      'Exactly one concurrent request must acquire execution',
    );

    assert.equal(
      blocked.length,
      1,
      'Exactly one concurrent request must be blocked',
    );

    assert.equal(
      acquired[0].session.analysisId,
      created.session.analysisId,
    );

    assert.equal(
      blocked[0].session.analysisId,
      created.session.analysisId,
    );

    assert.equal(
      acquired[0].session.status,
      ANALYSIS_SESSION_STATES.processing,
    );

    assert.equal(
      acquired[0].session.attempt,
      1,
      'The winning claim must start attempt 1',
    );

    assert.equal(
      blocked[0].reason,
      'IN_PROGRESS',
    );

    assert.equal(
      blocked[0].session.attempt,
      1,
      'A duplicate concurrent claim must not increment attempt',
    );

    assert.ok(
      acquired[0].leaseToken,
      'The winning execution must receive a lease token',
    );

    assert.equal(
      blocked[0].leaseToken,
      null,
      'The blocked execution must not receive a lease token',
    );
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

    assertCompatible0062Contract(
      ANALYSIS_SESSION_CONTRACT_VERSION,
    );

    assert.equal(
      a.session.analysisId,
      b.session.analysisId,
      'Duplicate idempotency keys must resolve to the same analysisId',
    );

    assert.equal(
      [a.reused, b.reused].filter(Boolean).length,
      1,
      'Exactly one create call must report reuse',
    );

    assert.equal(
      a.session.idempotencyKey,
      'idem-42',
    );

    assert.equal(
      b.session.idempotencyKey,
      'idem-42',
    );
  });
});

test('006.2 completed session cannot be executed again', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u3',
      idempotencyKey: 'done-1',
    });

    const claim = await store.claimExecution(
      created.session.analysisId,
      'u3',
    );

    assert.equal(claim.acquired, true);
    assert.ok(claim.leaseToken);

    await store.markCompleted(
      created.session.analysisId,
      'u3',
      {
        success: true,
        analysis: {
          sentinel: 'original-result',
        },
      },
      {
        leaseToken: claim.leaseToken,
      },
    );

    const duplicate = await store.claimExecution(
      created.session.analysisId,
      'u3',
    );

    assert.equal(
      duplicate.acquired,
      false,
      'A completed analysis must never acquire a second execution',
    );

    assert.equal(
      duplicate.reason,
      'COMPLETED',
    );

    assert.equal(
      duplicate.session.result.analysis.sentinel,
      'original-result',
      'The original authoritative result must be preserved',
    );

    assert.equal(
      duplicate.session.attempt,
      1,
      'A completed-session duplicate must not increment attempt',
    );

    assert.equal(
      duplicate.leaseToken,
      null,
      'A completed-session duplicate must not receive a lease',
    );
  });
});

test('006.2 stale/wrong execution lease cannot overwrite active execution', async () => {
  await withStore(async (store) => {
    const created = await store.createOrReuse({
      userId: 'u4',
      idempotencyKey: 'lease-1',
    });

    const claim = await store.claimExecution(
      created.session.analysisId,
      'u4',
    );

    assert.equal(claim.acquired, true);
    assert.ok(claim.leaseToken);

    await assert.rejects(
      store.markCompleted(
        created.session.analysisId,
        'u4',
        {
          success: true,
        },
        {
          leaseToken: 'wrong-lease',
        },
      ),
      /lease mismatch/,
    );

    const current = await store.get(
      created.session.analysisId,
      'u4',
    );

    assert.equal(
      current.status,
      ANALYSIS_SESSION_STATES.processing,
      'A rejected stale write must leave the active execution untouched',
    );

    assert.equal(
      current.attempt,
      1,
    );
  });
});