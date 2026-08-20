import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PostgresAnalysisSessionStore } from '../services/postgresAnalysisSessionStore.js';

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const LIVE = Boolean(DATABASE_URL);

function makeStore() {
  return new PostgresAnalysisSessionStore({
    connectionString: DATABASE_URL,
    sslMode: process.env.DATABASE_SSL_MODE,
    autoMigrate: true,
    leaseTtlMs: 60_000,
    sessionTtlMs: 15 * 60_000,
  });
}

async function cleanup(store, analysisId) {
  if (!analysisId) return;
  await store.pool.query(
    'DELETE FROM cellcount_analysis_sessions WHERE analysis_id = $1::uuid',
    [analysisId],
  );
}

test('INF-SCALE-001.1C live PostgreSQL certifies cross-instance idempotency, lease exclusivity and result visibility', { skip: !LIVE }, async () => {
  const storeA = makeStore();
  const storeB = makeStore();
  const suffix = crypto.randomUUID();
  const userId = `inf-scale-cert-${suffix}`;
  const idempotencyKey = `cert-${suffix}`;
  let analysisId = null;

  try {
    await Promise.all([storeA.ensureSchema(), storeB.ensureSchema()]);

    const creates = await Promise.all(
      Array.from({ length: 16 }, (_, index) =>
        (index % 2 === 0 ? storeA : storeB).createOrReuse({
          userId,
          idempotencyKey,
          metadata: { certification: 'INF-SCALE-001.1C', contender: index },
        }),
      ),
    );

    const analysisIds = new Set(creates.map((entry) => entry.session.analysisId));
    assert.equal(analysisIds.size, 1, 'all instances must converge on one analysisId');
    analysisId = [...analysisIds][0];
    assert.equal(creates.filter((entry) => entry.reused === false).length, 1, 'exactly one session insert must win');

    const claims = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        (index % 2 === 0 ? storeA : storeB).claimExecution(analysisId, userId),
      ),
    );
    const winners = claims.filter((entry) => entry.acquired === true);
    assert.equal(winners.length, 1, 'exactly one distributed execution lease must be acquired');

    const winner = winners[0];
    await assert.rejects(
      () => storeB.markCompleted(
        analysisId,
        userId,
        { certification: 'must-not-write' },
        { leaseToken: crypto.randomUUID() },
      ),
      /lease/i,
      'a different instance with a wrong lease must not complete the analysis',
    );

    const authoritativeResult = {
      certification: 'INF-SCALE-001.1C',
      crossInstance: true,
      marker: suffix,
    };
    const completed = await storeA.markCompleted(
      analysisId,
      userId,
      authoritativeResult,
      { leaseToken: winner.leaseToken },
    );
    assert.equal(completed.status, 'COMPLETED');

    const observedFromOtherInstance = await storeB.get(analysisId, userId);
    assert.equal(observedFromOtherInstance?.status, 'COMPLETED');
    assert.deepEqual(observedFromOtherInstance?.result, authoritativeResult);

    const duplicateAfterCompletion = await storeB.createOrReuse({ userId, idempotencyKey });
    assert.equal(duplicateAfterCompletion.reused, true);
    assert.equal(duplicateAfterCompletion.session.analysisId, analysisId);
    assert.equal(duplicateAfterCompletion.session.status, 'COMPLETED');

    const postCompletionClaim = await storeB.claimExecution(analysisId, userId);
    assert.equal(postCompletionClaim.acquired, false);
    assert.equal(postCompletionClaim.session.status, 'COMPLETED');
  } finally {
    try { await cleanup(storeA, analysisId); } finally {
      await Promise.allSettled([storeA.close(), storeB.close()]);
    }
  }
});

if (!LIVE) {
  test('INF-SCALE-001.1C live certification requires DATABASE_URL', () => {
    assert.equal(LIVE, false);
  });
}
