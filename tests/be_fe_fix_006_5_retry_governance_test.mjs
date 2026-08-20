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

async function fixture(options, fn) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'cellcount-0065-'));
  try {
    await fn(new AnalysisSessionStore({ rootDir: root, ...options }));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('006.5 retryable failure preserves analysisId and authorizes fresh lease', async () => {
  await fixture({ maxAttempts: 3 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u1',
      idempotencyKey: 'retry-1',
    });

    const first = await store.claimExecution(created.session.analysisId, 'u1');
    const failed = await store.markFailed(
      created.session.analysisId,
      'u1',
      {
        code: 'ANALYZE_SLIDE_ERROR',
        message: 'temporary upstream failure',
        statusCode: 500,
      },
      { leaseToken: first.leaseToken },
    );

    assert.equal(ANALYSIS_SESSION_CONTRACT_VERSION, 'BE/FE-FIX-006.5');
    assert.equal(failed.status, ANALYSIS_SESSION_STATES.retryEligible);
    assert.equal(failed.retryEligible, true);
    assert.equal(failed.attempt, 1);

    const second = await store.claimExecution(
      created.session.analysisId,
      'u1',
    );

    assert.equal(second.acquired, true);
    assert.equal(second.session.analysisId, created.session.analysisId);
    assert.equal(second.session.attempt, 2);
    assert.notEqual(second.leaseToken, first.leaseToken);
  });
});

test('006.5 max attempts convert retryable failure into permanent FAILED', async () => {
  await fixture({ maxAttempts: 2 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u2',
      idempotencyKey: 'retry-max',
    });

    for (let i = 0; i < 2; i += 1) {
      const claim = await store.claimExecution(created.session.analysisId, 'u2');
      assert.equal(claim.acquired, true);
      const failed = await store.markFailed(
        created.session.analysisId,
        'u2',
        { code: 'ANALYZE_SLIDE_ERROR', statusCode: 500 },
        { leaseToken: claim.leaseToken },
      );

      if (i === 0) {
        assert.equal(failed.status, ANALYSIS_SESSION_STATES.retryEligible);
      } else {
        assert.equal(failed.status, ANALYSIS_SESSION_STATES.failed);
        assert.equal(failed.retryEligible, false);
        assert.equal(failed.terminalReason, 'MAX_ATTEMPTS_EXHAUSTED');
      }
    }

    const blocked = await store.claimExecution(
      created.session.analysisId,
      'u2',
    );
    assert.equal(blocked.acquired, false);
  });
});

test('006.5 orphaned PROCESSING lease becomes retry eligible and rejects stale completion', async () => {
  await fixture({ leaseTtlMs: 20, maxAttempts: 3 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u3',
      idempotencyKey: 'orphan-1',
    });
    const first = await store.claimExecution(created.session.analysisId, 'u3');

    await new Promise((resolve) => setTimeout(resolve, 35));
    const recovered = await store.get(created.session.analysisId, 'u3');

    assert.equal(recovered.status, ANALYSIS_SESSION_STATES.retryEligible);
    assert.equal(recovered.lastFailure.code, 'ORPHANED_EXECUTION_LEASE_EXPIRED');

    const second = await store.claimExecution(created.session.analysisId, 'u3');
    assert.equal(second.acquired, true);
    assert.notEqual(second.leaseToken, first.leaseToken);

    await assert.rejects(
      store.markCompleted(
        created.session.analysisId,
        'u3',
        { stale: true },
        { leaseToken: first.leaseToken },
      ),
      /lease mismatch/,
    );
  });
});

test('006.5 abandoned active session expires deterministically', async () => {
  await fixture({ sessionTtlMs: 20 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u4',
      idempotencyKey: 'expire-1',
    });
    await new Promise((resolve) => setTimeout(resolve, 35));

    const expired = await store.get(created.session.analysisId, 'u4');
    assert.equal(expired.status, ANALYSIS_SESSION_STATES.expired);
    assert.equal(expired.terminalReason, 'SESSION_TTL_EXPIRED');

    const claim = await store.claimExecution(created.session.analysisId, 'u4');
    assert.equal(claim.acquired, false);
    assert.equal(claim.reason, 'EXPIRED');
  });
});

test('006.5 completed result is not expired by active-session TTL', async () => {
  await fixture({ sessionTtlMs: 20 }, async (store) => {
    const created = await store.createOrReuse({
      userId: 'u5',
      idempotencyKey: 'completed-retained',
    });
    const claim = await store.claimExecution(created.session.analysisId, 'u5');
    await store.markCompleted(
      created.session.analysisId,
      'u5',
      { success: true, sentinel: 'authoritative' },
      { leaseToken: claim.leaseToken },
    );

    await new Promise((resolve) => setTimeout(resolve, 35));
    const completed = await store.get(created.session.analysisId, 'u5');
    assert.equal(completed.status, ANALYSIS_SESSION_STATES.completed);
    assert.equal(completed.result.sentinel, 'authoritative');
  });
});
