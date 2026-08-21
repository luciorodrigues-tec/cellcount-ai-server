import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  CERTIFICATION_VERSION,
  reconcileAuthoritativeSession,
  summarizeStage,
} from '../scripts/certifyHorizontalWorkerScaling.mjs';

test('INF-SCALE-001.2F.2 certification version and timeout taxonomy are explicit', () => {
  assert.equal(CERTIFICATION_VERSION, 'INF-SCALE-001.2F.2');
  const source = fs.readFileSync(new URL('../scripts/certifyHorizontalWorkerScaling.mjs', import.meta.url), 'utf8');
  assert.match(source, /CLINICAL_EXECUTION_TIMEOUT/);
  assert.match(source, /HARNESS_OBSERVATION_TIMEOUT/);
  assert.match(source, /POLL_TRANSPORT_ERROR/);
  assert.match(source, /authoritative_direct_read/);
});

test('INF-SCALE-001.2F.2 recovered authoritative completion is counted as clean completion', () => {
  const summary = summarizeStage({
    level: 1,
    startedAt: 0,
    endedAt: 60_000,
    records: [{
      submitAccepted: true,
      analysisId: 'a',
      finalStatus: 'COMPLETED',
      attempts: 1,
      submitLatencyMs: 100,
      e2eLatencyMs: 40_000,
      observationRecovered: true,
      recoveredBy: 'authoritative_direct_read',
      error: null,
    }],
  });
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 0);
  assert.equal(summary.pass, true);
});

test('INF-SCALE-001.2F.2 final reconciliation retries direct authoritative reads', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls < 3) throw new Error('temporary transport failure');
    return new Response(JSON.stringify({ session: { status: 'COMPLETED', attempt: 1, completedAt: new Date().toISOString(), result: {} } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  try {
    const result = await reconcileAuthoritativeSession({
      baseUrl: 'https://example.invalid', headers: {}, analysisId: 'abc', ordinal: 1,
      submitStartedAt: Date.now() - 1000, requestTimeoutMs: 1000, attempts: 3,
    });
    assert.equal(result.observed, true);
    assert.equal(result.terminal, true);
    assert.equal(result.session.status, 'COMPLETED');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
