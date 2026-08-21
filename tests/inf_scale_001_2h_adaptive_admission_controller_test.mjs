import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INF_SCALE_001_2H_VERSION,
  ADAPTIVE_ADMISSION_POLICY_VERSION,
  AUTOSCALING_READINESS_VERSION,
  ADMISSION_DECISIONS,
  resolveAdaptiveAdmissionConfig,
  deriveAutoscalingReadiness,
  evaluateAdmissionSnapshot,
  AdaptiveAnalysisAdmissionController,
} from '../services/adaptiveAnalysisAdmissionController.js';

function cfg(overrides = {}) {
  return {
    ...resolveAdaptiveAdmissionConfig({
      ANALYSIS_WORKER_CONCURRENCY: '4',
      ANALYSIS_QUEUE_MAX_DEPTH: '100',
      ANALYSIS_ADMISSION_SOFT_QUEUE_PRESSURE: '0.75',
      ANALYSIS_ADMISSION_HARD_QUEUE_PRESSURE: '1',
      ANALYSIS_ADMISSION_MAX_WAITING_PER_WORKER: '12',
      ANALYSIS_ADMISSION_OLDEST_WAITING_SOFT_MS: '180000',
      ANALYSIS_AUTOSCALE_TARGET_ACTIVE_PER_WORKER: '12',
      ANALYSIS_AUTOSCALE_MIN_WORKERS: '1',
      ANALYSIS_AUTOSCALE_MAX_WORKERS: '16',
    }),
    ...overrides,
  };
}

test('INF-SCALE-001.2H config exposes adaptive admission and autoscaling readiness without automatic scaling', () => {
  const c = cfg();
  assert.equal(c.architectureVersion, INF_SCALE_001_2H_VERSION);
  assert.equal(c.policyVersion, ADAPTIVE_ADMISSION_POLICY_VERSION);
  assert.equal(c.autoscalingReadinessVersion, AUTOSCALING_READINESS_VERSION);
  assert.equal(c.workerConcurrency, 4);
  assert.equal(c.maxQueueDepth, 100);
});

test('INF-SCALE-001.2H-A admits below the soft pressure envelope', () => {
  const out = evaluateAdmissionSnapshot(
    { waiting: 8, processing: 4, active: 12, maxQueueDepth: 100, saturated: false, oldestWaitingAgeMs: 20_000 },
    cfg(),
  );
  assert.equal(out.decision, ADMISSION_DECISIONS.admit);
  assert.equal(out.reason, 'capacity_available');
});

test('INF-SCALE-001.2H-A defers before hard queue saturation', () => {
  const out = evaluateAdmissionSnapshot(
    { waiting: 72, processing: 4, active: 76, maxQueueDepth: 100, saturated: false, oldestWaitingAgeMs: 30_000 },
    cfg(),
  );
  assert.equal(out.decision, ADMISSION_DECISIONS.defer);
  assert.equal(out.reason, 'soft_queue_pressure');
  assert.equal(out.autoscaling.recommendation, 'SCALE_OUT');
  assert.ok(out.autoscaling.recommendedWorkers > 4);
});

test('INF-SCALE-001.2H-A preserves hard backpressure as the final capacity boundary', () => {
  const out = evaluateAdmissionSnapshot(
    { waiting: 96, processing: 4, active: 100, maxQueueDepth: 100, saturated: true, oldestWaitingAgeMs: 60_000 },
    cfg(),
  );
  assert.equal(out.decision, ADMISSION_DECISIONS.backpressure);
  assert.equal(out.reason, 'hard_queue_capacity');
});

test('INF-SCALE-001.2H-B derives recommendation-only scale-out signals', () => {
  const out = deriveAutoscalingReadiness(
    { waiting: 44, processing: 4, active: 48, maxQueueDepth: 100, oldestWaitingAgeMs: 200_000 },
    cfg(),
  );
  assert.equal(out.recommendationOnly, true);
  assert.equal(out.actionOnly, false);
  assert.equal(out.currentWorkers, 4);
  assert.equal(out.recommendation, 'SCALE_OUT');
  assert.ok(out.recommendedWorkers >= 5);
  assert.equal(out.signals.processing, 4);
});

test('INF-SCALE-001.2H-A idempotent existing job is admitted even during pressure', async () => {
  const queue = {
    getByAnalysisId: async () => ({ analysisId: 'a', status: 'QUEUED' }),
    getBackpressureSnapshot: async () => ({
      waiting: 96, processing: 4, active: 100, maxQueueDepth: 100, saturated: true, oldestWaitingAgeMs: 1000,
    }),
  };
  const controller = new AdaptiveAnalysisAdmissionController({
    queue,
    workerPoolConfig: { concurrency: 4, maxQueueDepth: 100 },
    env: {
      ANALYSIS_WORKER_CONCURRENCY: '4',
      ANALYSIS_QUEUE_MAX_DEPTH: '100',
    },
  });
  const out = await controller.assess({ analysisId: '00000000-0000-4000-8000-000000000001' });
  assert.equal(out.decision, ADMISSION_DECISIONS.admit);
  assert.equal(out.reason, 'idempotent_existing_job');
  assert.equal(out.existing, true);
});
