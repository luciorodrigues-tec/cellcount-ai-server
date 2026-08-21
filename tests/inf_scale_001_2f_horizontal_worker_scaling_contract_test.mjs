import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SCALE_EFFICIENCY_GATE,
  HIGH_VOLUME_CONFIRMATION,
  parseLevels,
  assertHighVolumeUnlocked,
  evaluateScale,
  summarizeStage,
} from '../scripts/certifyHorizontalWorkerScaling.mjs';

test('INF-SCALE-001.2F uses 5/10 for 2 workers and 10/25 for 4 workers', () => {
  assert.deepEqual(parseLevels('', 2), [5, 10]);
  assert.deepEqual(parseLevels('', 4), [10, 25]);
  assert.deepEqual(parseLevels('10,5,10', 2), [5, 10]);
});

test('INF-SCALE-001.2F protects 25-job clinical load behind explicit acknowledgement', () => {
  assert.throws(() => assertHighVolumeUnlocked([10, 25], ''), /real clinical analyses/i);
  assert.doesNotThrow(() => assertHighVolumeUnlocked([10, 25], HIGH_VOLUME_CONFIRMATION));
  assert.throws(() => assertHighVolumeUnlocked([50], HIGH_VOLUME_CONFIRMATION), /caps a single horizontal-scaling stage at 25/i);
});

test('INF-SCALE-001.2F calculates horizontal scale efficiency against certified baseline', () => {
  const good = evaluateScale({ baselineWorkers: 1, baselineThroughputPerMinute: 1.55, observedWorkers: 2, observedThroughputPerMinute: 2.5, efficiencyGate: DEFAULT_SCALE_EFFICIENCY_GATE });
  assert.equal(good.idealScaleFactor, 2);
  assert.equal(good.observedScaleFactor, 1.613);
  assert.equal(good.efficiency, 0.806);
  assert.equal(good.pass, true);

  const poor = evaluateScale({ baselineWorkers: 1, baselineThroughputPerMinute: 1.55, observedWorkers: 2, observedThroughputPerMinute: 1.8, efficiencyGate: 0.70 });
  assert.equal(poor.pass, false);
});

test('INF-SCALE-001.2F rejects duplicates, retries and terminal failures independently of throughput', () => {
  const summary = summarizeStage({
    level: 4,
    startedAt: 0,
    endedAt: 60_000,
    records: [
      { submitAccepted: true, analysisId: 'a', submitLatencyMs: 10, finalStatus: 'COMPLETED', e2eLatencyMs: 1000, attempts: 1 },
      { submitAccepted: true, analysisId: 'b', submitLatencyMs: 20, finalStatus: 'COMPLETED', e2eLatencyMs: 1200, attempts: 2 },
      { submitAccepted: true, analysisId: 'a', submitLatencyMs: 20, finalStatus: 'COMPLETED', e2eLatencyMs: 1300, attempts: 1 },
      { submitAccepted: true, analysisId: 'c', submitLatencyMs: 30, finalStatus: 'FAILED', e2eLatencyMs: 1400, attempts: 1 },
    ],
  });
  assert.equal(summary.duplicateAnalysisIds, 1);
  assert.equal(summary.maxAttempts, 2);
  assert.equal(summary.failed, 1);
  assert.equal(summary.pass, false);
});
