export const INF_SCALE_001_2H_VERSION = 'INF-SCALE-001.2H';
export const ADAPTIVE_ADMISSION_POLICY_VERSION = 'INF-SCALE-001.2H-A';
export const AUTOSCALING_READINESS_VERSION = 'INF-SCALE-001.2H-B';
export const CAPACITY_ENVELOPE_CERTIFICATION_VERSION = 'INF-SCALE-001.2H-C';
export const PRODUCTION_CAPACITY_CALIBRATION_VERSION = 'INF-SCALE-001.2H-D';
export const MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION = 'INF-SCALE-001.2H-E';

export const ADMISSION_DECISIONS = Object.freeze({
  admit: 'ADMIT',
  defer: 'DEFER',
  backpressure: 'BACKPRESSURE',
});

function numberInRange(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min ? Math.min(n, max) : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function resolveAdaptiveAdmissionConfig(env = process.env, workerPoolConfig = {}) {
  const maxQueueDepth = positiveInt(
    env.ANALYSIS_QUEUE_MAX_DEPTH ?? workerPoolConfig.maxQueueDepth,
    positiveInt(workerPoolConfig.maxQueueDepth, 100),
    { max: 100_000 },
  );
  const workerConcurrency = positiveInt(
    env.ANALYSIS_WORKER_CONCURRENCY ?? workerPoolConfig.concurrency,
    positiveInt(workerPoolConfig.concurrency, 1),
    { max: 64 },
  );

  return Object.freeze({
    architectureVersion: INF_SCALE_001_2H_VERSION,
    policyVersion: ADAPTIVE_ADMISSION_POLICY_VERSION,
    autoscalingReadinessVersion: AUTOSCALING_READINESS_VERSION,
    enabled: String(env.ANALYSIS_ADAPTIVE_ADMISSION_ENABLED ?? 'true').trim().toLowerCase() !== 'false',
    workerConcurrency,
    maxQueueDepth,
    softQueuePressure: numberInRange(env.ANALYSIS_ADMISSION_SOFT_QUEUE_PRESSURE, 0.75, { min: 0.25, max: 0.99 }),
    hardQueuePressure: numberInRange(env.ANALYSIS_ADMISSION_HARD_QUEUE_PRESSURE, 1.0, { min: 0.5, max: 1.5 }),
    maxWaitingPerWorker: numberInRange(env.ANALYSIS_ADMISSION_MAX_WAITING_PER_WORKER, 12, { min: 1, max: 10_000 }),
    oldestWaitingSoftMs: positiveInt(env.ANALYSIS_ADMISSION_OLDEST_WAITING_SOFT_MS, 180_000, { max: 7_200_000 }),
    retryAfterMs: positiveInt(env.ANALYSIS_ADMISSION_RETRY_AFTER_MS, 5000, { min: 250, max: 300_000 }),
    autoscaleTargetActivePerWorker: numberInRange(env.ANALYSIS_AUTOSCALE_TARGET_ACTIVE_PER_WORKER, 12, { min: 1, max: 1000 }),
    autoscaleMinWorkers: positiveInt(env.ANALYSIS_AUTOSCALE_MIN_WORKERS, 1, { max: 64 }),
    autoscaleMaxWorkers: positiveInt(env.ANALYSIS_AUTOSCALE_MAX_WORKERS, 16, { max: 64 }),
    autoscaleScaleInUtilization: numberInRange(env.ANALYSIS_AUTOSCALE_SCALE_IN_UTILIZATION, 0.20, { min: 0, max: 0.8 }),
    autoscaleDrainTargetMinutes: numberInRange(env.ANALYSIS_AUTOSCALE_DRAIN_TARGET_MINUTES, 5, { min: 0.5, max: 120 }),
    autoscaleHysteresisWorkers: positiveInt(env.ANALYSIS_AUTOSCALE_HYSTERESIS_WORKERS, 1, { min: 1, max: 8 }),
    autoscaleHysteresisObservations: positiveInt(env.ANALYSIS_AUTOSCALE_HYSTERESIS_OBSERVATIONS, 2, { min: 1, max: 20 }),
  });
}

export function deriveAutoscalingReadiness(snapshot = {}, config = {}) {
  const workers = Math.max(1, Number(config.workerConcurrency || 1));
  const waiting = Math.max(0, Number(snapshot.waiting || 0));
  const processing = Math.max(0, Number(snapshot.processing || 0));
  const active = Math.max(0, Number(snapshot.active || waiting + processing));
  const maxQueueDepth = Math.max(1, Number(snapshot.maxQueueDepth || config.maxQueueDepth || 1));
  const queuePressure = active / maxQueueDepth;
  const workerUtilization = clamp(processing / workers);
  const waitingPerWorker = waiting / workers;
  const targetActivePerWorker = Math.max(1, Number(config.autoscaleTargetActivePerWorker || 12));
  const minWorkers = Math.max(1, Number(config.autoscaleMinWorkers || 1));
  const maxWorkers = Math.max(minWorkers, Number(config.autoscaleMaxWorkers || 16));

  let recommendedWorkers = Math.ceil(active / targetActivePerWorker);
  recommendedWorkers = Math.max(minWorkers, Math.min(maxWorkers, recommendedWorkers || minWorkers));

  let recommendation = 'HOLD';
  let reason = 'capacity_within_target';

  if (
    waiting > 0 &&
    (
      queuePressure >= Number(config.softQueuePressure || 0.75) ||
      waitingPerWorker >= Number(config.maxWaitingPerWorker || 12) ||
      Number(snapshot.oldestWaitingAgeMs || 0) >= Number(config.oldestWaitingSoftMs || 180_000)
    )
  ) {
    recommendedWorkers = Math.max(workers + 1, recommendedWorkers);
    recommendedWorkers = Math.min(maxWorkers, recommendedWorkers);
    recommendation = recommendedWorkers > workers ? 'SCALE_OUT' : 'AT_MAX_CAPACITY';
    reason = queuePressure >= Number(config.softQueuePressure || 0.75)
      ? 'queue_pressure'
      : waitingPerWorker >= Number(config.maxWaitingPerWorker || 12)
        ? 'waiting_per_worker'
        : 'oldest_waiting_age';
  } else if (
    waiting === 0 &&
    active === processing &&
    workerUtilization <= Number(config.autoscaleScaleInUtilization || 0.20) &&
    workers > minWorkers
  ) {
    recommendedWorkers = Math.max(minWorkers, Math.min(workers - 1, recommendedWorkers || workers - 1));
    recommendation = recommendedWorkers < workers ? 'SCALE_IN_CANDIDATE' : 'HOLD';
    reason = 'sustained_low_utilization_candidate';
  } else {
    recommendedWorkers = Math.max(minWorkers, Math.min(maxWorkers, Math.max(workers, recommendedWorkers)));
  }

  const capacityPerWorker = targetActivePerWorker;
  const currentCapacity = workers * capacityPerWorker;
  const capacityHeadroom = Math.max(0, currentCapacity - active);
  const estimatedDrainMinutes = waiting > 0
    ? Number((waiting / Math.max(1, workers * capacityPerWorker) * Number(config.autoscaleDrainTargetMinutes || 5)).toFixed(3))
    : 0;

  return Object.freeze({
    version: AUTOSCALING_READINESS_VERSION,
    capacityEnvelopeVersion: CAPACITY_ENVELOPE_CERTIFICATION_VERSION,
    actionOnly: false,
    recommendationOnly: true,
    currentWorkers: workers,
    recommendedWorkers,
    recommendation,
    reason,
    signals: {
      waiting,
      processing,
      active,
      maxQueueDepth,
      queuePressure: Number(queuePressure.toFixed(4)),
      workerUtilization: Number(workerUtilization.toFixed(4)),
      waitingPerWorker: Number(waitingPerWorker.toFixed(4)),
      oldestWaitingAgeMs: Math.max(0, Number(snapshot.oldestWaitingAgeMs || 0)),
      capacityHeadroom,
      estimatedDrainMinutes,
    },
  });
}


export function stabilizeAutoscalingRecommendation(previousState = {}, current = {}, config = {}) {
  const required = Math.max(1, Number(config.autoscaleHysteresisObservations || 2));
  const candidate = String(current.recommendation || 'HOLD');
  const previousCandidate = String(previousState.candidate || '');
  const consecutive = candidate === previousCandidate ? Number(previousState.consecutive || 0) + 1 : 1;
  const immediate = candidate === 'AT_MAX_CAPACITY';
  const stableRecommendation = immediate || consecutive >= required ? candidate : 'HOLD';
  return Object.freeze({
    candidate,
    consecutive,
    requiredObservations: required,
    stableRecommendation,
    hysteresisActive: stableRecommendation !== candidate,
  });
}

export function evaluateAdmissionSnapshot(snapshot = {}, config = {}) {
  const active = Math.max(0, Number(snapshot.active || 0));
  const waiting = Math.max(0, Number(snapshot.waiting || 0));
  const maxQueueDepth = Math.max(1, Number(snapshot.maxQueueDepth || config.maxQueueDepth || 1));
  const workers = Math.max(1, Number(config.workerConcurrency || 1));
  const queuePressure = active / maxQueueDepth;
  const waitingPerWorker = waiting / workers;
  const oldestWaitingAgeMs = Math.max(0, Number(snapshot.oldestWaitingAgeMs || 0));
  const autoscaling = deriveAutoscalingReadiness(snapshot, config);

  if (config.enabled === false) {
    return Object.freeze({
      version: ADAPTIVE_ADMISSION_POLICY_VERSION,
      decision: ADMISSION_DECISIONS.admit,
      reason: 'adaptive_admission_disabled',
      retryAfterMs: null,
      snapshot,
      autoscaling,
    });
  }

  if (snapshot.saturated === true || queuePressure >= Number(config.hardQueuePressure || 1)) {
    return Object.freeze({
      version: ADAPTIVE_ADMISSION_POLICY_VERSION,
      decision: ADMISSION_DECISIONS.backpressure,
      reason: 'hard_queue_capacity',
      retryAfterMs: Number(config.retryAfterMs || 5000),
      snapshot,
      autoscaling,
    });
  }

  if (
    queuePressure >= Number(config.softQueuePressure || 0.75) ||
    waitingPerWorker >= Number(config.maxWaitingPerWorker || 12) ||
    oldestWaitingAgeMs >= Number(config.oldestWaitingSoftMs || 180_000)
  ) {
    return Object.freeze({
      version: ADAPTIVE_ADMISSION_POLICY_VERSION,
      decision: ADMISSION_DECISIONS.defer,
      reason:
        queuePressure >= Number(config.softQueuePressure || 0.75)
          ? 'soft_queue_pressure'
          : waitingPerWorker >= Number(config.maxWaitingPerWorker || 12)
            ? 'waiting_per_worker'
            : 'oldest_waiting_age',
      retryAfterMs: Number(config.retryAfterMs || 5000),
      snapshot,
      autoscaling,
    });
  }

  return Object.freeze({
    version: ADAPTIVE_ADMISSION_POLICY_VERSION,
    decision: ADMISSION_DECISIONS.admit,
    reason: 'capacity_available',
    retryAfterMs: null,
    snapshot,
    autoscaling,
  });
}

export class AdaptiveAnalysisAdmissionController {
  constructor({ queue, workerPoolConfig = {}, env = process.env } = {}) {
    if (!queue || typeof queue.getBackpressureSnapshot !== 'function') {
      throw new Error('INF-SCALE-001.2H: durable queue with getBackpressureSnapshot() is required.');
    }
    this.queue = queue;
    this.config = resolveAdaptiveAdmissionConfig(env, workerPoolConfig);
    this.autoscalingHysteresisState = Object.freeze({ candidate: '', consecutive: 0 });
  }

  get scalabilityMetadata() {
    return Object.freeze({
      architectureVersion: INF_SCALE_001_2H_VERSION,
      policyVersion: ADAPTIVE_ADMISSION_POLICY_VERSION,
      autoscalingReadinessVersion: AUTOSCALING_READINESS_VERSION,
      capacityEnvelopeVersion: CAPACITY_ENVELOPE_CERTIFICATION_VERSION,
      productionCapacityCalibrationVersion: PRODUCTION_CAPACITY_CALIBRATION_VERSION,
      enabled: this.config.enabled,
      decisions: Object.values(ADMISSION_DECISIONS),
      mutatesWorkerCount: false,
      recommendationOnly: true,
      workerConcurrency: this.config.workerConcurrency,
      maxQueueDepth: this.config.maxQueueDepth,
      softQueuePressure: this.config.softQueuePressure,
      hardQueuePressure: this.config.hardQueuePressure,
      hysteresisObservations: this.config.autoscaleHysteresisObservations,
    });
  }

  async assess({ analysisId = null } = {}) {
    if (analysisId && typeof this.queue.getByAnalysisId === 'function') {
      const existing = await this.queue.getByAnalysisId(analysisId);
      if (existing) {
        const snapshot = await this.queue.getBackpressureSnapshot({
          maxQueueDepth: this.config.maxQueueDepth,
        });
        return Object.freeze({
          version: ADAPTIVE_ADMISSION_POLICY_VERSION,
          decision: ADMISSION_DECISIONS.admit,
          reason: 'idempotent_existing_job',
          existing: true,
          retryAfterMs: null,
          snapshot,
          autoscaling: deriveAutoscalingReadiness(snapshot, this.config),
        });
      }
    }

    const snapshot = await this.queue.getBackpressureSnapshot({
      maxQueueDepth: this.config.maxQueueDepth,
    });
    return evaluateAdmissionSnapshot(snapshot, this.config);
  }

  async operationalSnapshot() {
    const snapshot = await this.queue.getBackpressureSnapshot({
      maxQueueDepth: this.config.maxQueueDepth,
    });
    const admission = evaluateAdmissionSnapshot(snapshot, this.config);
    const hysteresis = stabilizeAutoscalingRecommendation(this.autoscalingHysteresisState, admission.autoscaling, this.config);
    this.autoscalingHysteresisState = Object.freeze({ candidate: hysteresis.candidate, consecutive: hysteresis.consecutive });
    return Object.freeze({
      architectureVersion: INF_SCALE_001_2H_VERSION,
      policyVersion: ADAPTIVE_ADMISSION_POLICY_VERSION,
      queue: snapshot,
      admission: {
        decision: admission.decision,
        reason: admission.reason,
        retryAfterMs: admission.retryAfterMs,
      },
      autoscaling: Object.freeze({ ...admission.autoscaling, hysteresis }),
    });
  }
}

export function createAdaptiveAnalysisAdmissionController(options) {
  return new AdaptiveAnalysisAdmissionController(options);
}
