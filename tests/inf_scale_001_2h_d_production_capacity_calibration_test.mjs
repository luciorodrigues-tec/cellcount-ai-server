import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_CAPACITY_CALIBRATION_VERSION,
  normalizeOperationalSample,
  evaluateCalibrationSample,
  summarizeProductionCalibration,
} from '../services/productionCapacityCalibration.js';

function payload({ t, waiting, processing, pressure, recommendation, stable = recommendation, estimated = 0, headroom = 0, oldest = 0 }) {
  return {
    observedAtMs: t,
    queue: { waiting, processing, active: waiting + processing, maxQueueDepth: 100, oldestWaitingAgeMs: oldest },
    admission: { decision: pressure >= 1 ? 'BACKPRESSURE' : pressure >= 0.75 ? 'DEFER' : 'ADMIT' },
    autoscaling: {
      recommendationOnly: true,
      actionOnly: false,
      currentWorkers: 4,
      recommendedWorkers: recommendation === 'SCALE_OUT' ? 7 : recommendation === 'SCALE_IN_CANDIDATE' ? 1 : 4,
      recommendation,
      signals: {
        waiting, processing, active: waiting + processing, maxQueueDepth: 100,
        queuePressure: pressure, workerUtilization: processing / 4,
        waitingPerWorker: waiting / 4, oldestWaitingAgeMs: oldest,
        capacityHeadroom: headroom, estimatedDrainMinutes: estimated,
      },
      hysteresis: { stableRecommendation: stable, hysteresisActive: stable !== recommendation },
    },
  };
}

test('INF-SCALE-001.2H-D normalizes read-only production telemetry', () => {
  const sample = normalizeOperationalSample(payload({ t: 1000, waiting: 8, processing: 4, pressure: 0.12, recommendation: 'HOLD' }), 1000);
  assert.equal(sample.version, PRODUCTION_CAPACITY_CALIBRATION_VERSION);
  assert.equal(sample.currentWorkers, 4);
  assert.equal(sample.recommendationOnly, true);
  assert.equal(sample.actionOnly, false);
});

test('INF-SCALE-001.2H-D rejects scale-in recommendation under measurable pressure', () => {
  const bad = normalizeOperationalSample(payload({ t: 1000, waiting: 60, processing: 4, pressure: 0.64, recommendation: 'SCALE_IN_CANDIDATE', oldest: 200000 }), 1000);
  const evaluated = evaluateCalibrationSample(bad);
  assert.equal(evaluated.pressure, true);
  assert.equal(evaluated.unsafeScaleIn, true);
  assert.equal(evaluated.pass, false);
});

test('INF-SCALE-001.2H-D validates scale-out decision when pressure is present', () => {
  const good = normalizeOperationalSample(payload({ t: 1000, waiting: 60, processing: 4, pressure: 0.64, recommendation: 'SCALE_OUT', oldest: 200000 }), 1000);
  const evaluated = evaluateCalibrationSample(good);
  assert.equal(evaluated.pressure, true);
  assert.equal(evaluated.scaleOutRecommended, true);
  assert.equal(evaluated.pass, true);
});

test('INF-SCALE-001.2H-D compares predicted drain with observed remaining drain', () => {
  const samples = [
    payload({ t: 0, waiting: 0, processing: 0, pressure: 0, recommendation: 'SCALE_IN_CANDIDATE' }),
    payload({ t: 60_000, waiting: 48, processing: 4, pressure: 0.52, recommendation: 'SCALE_OUT', stable: 'HOLD', estimated: 4, oldest: 200000 }),
    payload({ t: 120_000, waiting: 72, processing: 4, pressure: 0.76, recommendation: 'SCALE_OUT', stable: 'SCALE_OUT', estimated: 5, oldest: 240000 }),
  ];
  const out = summarizeProductionCalibration({ samples, startedAtMs: 0, endedAtMs: 420_000, accepted: 25, completed: 25, admissionControlled: 0, observedThroughputPerMinute: 3.57, drainPredictionToleranceRatio: 0.55 });
  assert.ok(out.drainPrediction);
  assert.equal(out.drainPrediction.predictedMinutes, 5);
  assert.equal(out.drainPrediction.observedRemainingMinutes, 5);
  assert.equal(out.gates.drainPredictionPass, true);
  assert.equal(out.pass, true);
});

test('INF-SCALE-001.2H-D preserves hysteresis evidence and forbids worker mutation', () => {
  const samples = [
    payload({ t: 0, waiting: 48, processing: 4, pressure: 0.52, recommendation: 'SCALE_OUT', stable: 'HOLD', estimated: 1, oldest: 200000 }),
    payload({ t: 1000, waiting: 52, processing: 4, pressure: 0.56, recommendation: 'SCALE_OUT', stable: 'SCALE_OUT', estimated: 1, oldest: 210000 }),
  ];
  const out = summarizeProductionCalibration({ samples, startedAtMs: 0, endedAtMs: 60_000, accepted: 5, completed: 5, admissionControlled: 0, observedThroughputPerMinute: 5, drainPredictionToleranceRatio: 10 });
  assert.equal(out.gates.noWorkerMutation, true);
  assert.equal(out.gates.hysteresisObserved, true);
  assert.equal(out.firstStableScaleOut.stableRecommendation, 'SCALE_OUT');
});
