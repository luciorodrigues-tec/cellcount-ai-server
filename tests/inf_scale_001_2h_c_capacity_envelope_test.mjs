import test from 'node:test';
import assert from 'node:assert/strict';
import { CAPACITY_ENVELOPE_CERTIFICATION_VERSION, resolveAdaptiveAdmissionConfig, deriveAutoscalingReadiness, evaluateAdmissionSnapshot, ADMISSION_DECISIONS } from '../services/adaptiveAnalysisAdmissionController.js';

const config = resolveAdaptiveAdmissionConfig({ ANALYSIS_WORKER_CONCURRENCY:'4', ANALYSIS_QUEUE_MAX_DEPTH:'100', ANALYSIS_AUTOSCALE_MIN_WORKERS:'1', ANALYSIS_AUTOSCALE_MAX_WORKERS:'16', ANALYSIS_AUTOSCALE_TARGET_ACTIVE_PER_WORKER:'12' });
const derive = (s) => deriveAutoscalingReadiness({ maxQueueDepth:100, oldestWaitingAgeMs:0, ...s }, config);

test('INF-SCALE-001.2H-C exposes quantitative capacity envelope', () => {
  const out = derive({waiting:0, processing:4, active:4});
  assert.equal(out.capacityEnvelopeVersion, CAPACITY_ENVELOPE_CERTIFICATION_VERSION);
  assert.equal(typeof out.signals.capacityHeadroom, 'number');
  assert.equal(typeof out.signals.estimatedDrainMinutes, 'number');
  assert.ok(out.recommendedWorkers >= 1 && out.recommendedWorkers <= 16);
});

test('INF-SCALE-001.2H-C low load is scale-in candidate without mutation', () => {
  const out = derive({waiting:0, processing:0, active:0});
  assert.equal(out.recommendation, 'SCALE_IN_CANDIDATE');
  assert.equal(out.recommendationOnly, true);
  assert.equal(out.actionOnly, false);
});

test('INF-SCALE-001.2H-C normal load holds current capacity', () => {
  const out = derive({waiting:8, processing:4, active:12});
  assert.equal(out.recommendation, 'HOLD');
  assert.equal(out.recommendedWorkers, 4);
});

test('INF-SCALE-001.2H-C rising pressure recommends scale-out', () => {
  const out = derive({waiting:48, processing:4, active:52, oldestWaitingAgeMs:200000});
  assert.equal(out.recommendation, 'SCALE_OUT');
  assert.ok(out.recommendedWorkers > 4);
});

test('INF-SCALE-001.2H-C hard backpressure remains distinct from scale recommendation', () => {
  const out = evaluateAdmissionSnapshot({waiting:96,processing:4,active:100,maxQueueDepth:100,saturated:true}, config);
  assert.equal(out.decision, ADMISSION_DECISIONS.backpressure);
  assert.notEqual(out.autoscaling.recommendation, 'BACKPRESSURE');
});

test('INF-SCALE-001.2H-C hysteresis suppresses one-sample recommendation flapping', async () => {
  const { stabilizeAutoscalingRecommendation } = await import('../services/adaptiveAnalysisAdmissionController.js');
  const first = stabilizeAutoscalingRecommendation({}, { recommendation:'SCALE_OUT' }, { autoscaleHysteresisObservations:2 });
  assert.equal(first.stableRecommendation, 'HOLD');
  assert.equal(first.hysteresisActive, true);
  const second = stabilizeAutoscalingRecommendation(first, { recommendation:'SCALE_OUT' }, { autoscaleHysteresisObservations:2 });
  assert.equal(second.stableRecommendation, 'SCALE_OUT');
});
