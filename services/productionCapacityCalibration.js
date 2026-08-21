export const PRODUCTION_CAPACITY_CALIBRATION_VERSION = 'INF-SCALE-001.2H-D';

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

export function normalizeOperationalSample(payload = {}, observedAtMs = Date.now()) {
  const queue = payload?.queue || {};
  const autoscaling = payload?.autoscaling || {};
  const signals = autoscaling?.signals || {};
  const hysteresis = autoscaling?.hysteresis || {};
  return Object.freeze({
    version: PRODUCTION_CAPACITY_CALIBRATION_VERSION,
    observedAtMs: finite(observedAtMs, Date.now()),
    decision: String(payload?.admission?.decision || 'UNKNOWN'),
    recommendation: String(autoscaling?.recommendation || 'UNKNOWN'),
    stableRecommendation: String(hysteresis?.stableRecommendation || autoscaling?.recommendation || 'UNKNOWN'),
    hysteresisActive: Boolean(hysteresis?.hysteresisActive),
    currentWorkers: Math.max(1, finite(autoscaling?.currentWorkers, 1)),
    recommendedWorkers: Math.max(1, finite(autoscaling?.recommendedWorkers, 1)),
    recommendationOnly: autoscaling?.recommendationOnly !== false,
    actionOnly: Boolean(autoscaling?.actionOnly),
    waiting: Math.max(0, finite(signals?.waiting ?? queue?.waiting, 0)),
    processing: Math.max(0, finite(signals?.processing ?? queue?.processing, 0)),
    active: Math.max(0, finite(signals?.active ?? queue?.active, 0)),
    maxQueueDepth: Math.max(1, finite(signals?.maxQueueDepth ?? queue?.maxQueueDepth, 1)),
    queuePressure: Math.max(0, finite(signals?.queuePressure, 0)),
    workerUtilization: clamp(signals?.workerUtilization, 0, 1),
    waitingPerWorker: Math.max(0, finite(signals?.waitingPerWorker, 0)),
    oldestWaitingAgeMs: Math.max(0, finite(signals?.oldestWaitingAgeMs ?? queue?.oldestWaitingAgeMs, 0)),
    capacityHeadroom: Math.max(0, finite(signals?.capacityHeadroom, 0)),
    estimatedDrainMinutes: Math.max(0, finite(signals?.estimatedDrainMinutes, 0)),
  });
}

export function evaluateCalibrationSample(sample = {}, {
  softQueuePressure = 0.75,
  maxWaitingPerWorker = 12,
  oldestWaitingSoftMs = 180_000,
} = {}) {
  const pressure =
    finite(sample.queuePressure, 0) >= finite(softQueuePressure, 0.75) ||
    finite(sample.waitingPerWorker, 0) >= finite(maxWaitingPerWorker, 12) ||
    finite(sample.oldestWaitingAgeMs, 0) >= finite(oldestWaitingSoftMs, 180_000);
  const scaleOutRecommended = ['SCALE_OUT', 'AT_MAX_CAPACITY'].includes(String(sample.recommendation));
  const unsafeScaleIn = pressure && String(sample.recommendation) === 'SCALE_IN_CANDIDATE';
  const mutatesWorkers = sample.recommendationOnly === false || sample.actionOnly === true;
  return Object.freeze({
    pressure,
    scaleOutRecommended,
    unsafeScaleIn,
    mutatesWorkers,
    pass: !unsafeScaleIn && !mutatesWorkers && (!pressure || scaleOutRecommended),
  });
}

export function summarizeProductionCalibration({
  samples = [],
  startedAtMs,
  endedAtMs,
  accepted = 0,
  completed = 0,
  admissionControlled = 0,
  observedThroughputPerMinute = 0,
  softQueuePressure = 0.75,
  maxWaitingPerWorker = 12,
  oldestWaitingSoftMs = 180_000,
  drainPredictionToleranceRatio = 0.55,
} = {}) {
  const normalized = samples
    .map((sample) => normalizeOperationalSample(sample, sample?.observedAtMs))
    .sort((a, b) => a.observedAtMs - b.observedAtMs);
  const evaluations = normalized.map((sample) => evaluateCalibrationSample(sample, {
    softQueuePressure,
    maxWaitingPerWorker,
    oldestWaitingSoftMs,
  }));
  const peak = normalized.reduce((best, sample) => {
    if (!best) return sample;
    if (sample.active > best.active) return sample;
    if (sample.active === best.active && sample.queuePressure > best.queuePressure) return sample;
    return best;
  }, null);
  const pressureSamples = normalized.filter((sample, index) => evaluations[index]?.pressure);
  const firstPressure = pressureSamples[0] || null;
  const firstStableScaleOut = normalized.find((sample) => ['SCALE_OUT', 'AT_MAX_CAPACITY'].includes(sample.stableRecommendation)) || null;
  const noWorkerMutation = evaluations.every((e) => !e.mutatesWorkers);
  const noUnsafeScaleIn = evaluations.every((e) => !e.unsafeScaleIn);
  const pressureDecisionValid = pressureSamples.length === 0 || pressureSamples.every((sample) => ['SCALE_OUT', 'AT_MAX_CAPACITY'].includes(sample.recommendation));
  const hysteresisObserved = normalized.some((sample) => sample.hysteresisActive);

  let drainPrediction = null;
  if (peak && peak.waiting > 0 && finite(endedAtMs, 0) > peak.observedAtMs && peak.estimatedDrainMinutes > 0) {
    const observedRemainingDrainMinutes = (finite(endedAtMs) - peak.observedAtMs) / 60_000;
    const absoluteErrorMinutes = Math.abs(peak.estimatedDrainMinutes - observedRemainingDrainMinutes);
    const relativeError = absoluteErrorMinutes / Math.max(observedRemainingDrainMinutes, 0.001);
    drainPrediction = Object.freeze({
      predictedMinutes: Number(peak.estimatedDrainMinutes.toFixed(3)),
      observedRemainingMinutes: Number(observedRemainingDrainMinutes.toFixed(3)),
      absoluteErrorMinutes: Number(absoluteErrorMinutes.toFixed(3)),
      relativeError: Number(relativeError.toFixed(3)),
      toleranceRatio: Number(drainPredictionToleranceRatio),
      pass: relativeError <= Number(drainPredictionToleranceRatio),
    });
  }

  const admissionAccountingPass = Math.max(0, finite(accepted)) + Math.max(0, finite(admissionControlled)) > 0;
  const completionPass = Math.max(0, finite(completed)) === Math.max(0, finite(accepted));
  const drainPredictionPass = drainPrediction ? drainPrediction.pass : true;
  const pass = noWorkerMutation && noUnsafeScaleIn && pressureDecisionValid && admissionAccountingPass && completionPass && drainPredictionPass;

  return Object.freeze({
    version: PRODUCTION_CAPACITY_CALIBRATION_VERSION,
    sampleCount: normalized.length,
    durationMs: Math.max(0, finite(endedAtMs) - finite(startedAtMs)),
    accepted: Math.max(0, finite(accepted)),
    completed: Math.max(0, finite(completed)),
    admissionControlled: Math.max(0, finite(admissionControlled)),
    observedThroughputPerMinute: Math.max(0, finite(observedThroughputPerMinute)),
    peak: peak ? Object.freeze({
      waiting: peak.waiting,
      processing: peak.processing,
      active: peak.active,
      queuePressure: peak.queuePressure,
      workerUtilization: peak.workerUtilization,
      waitingPerWorker: peak.waitingPerWorker,
      oldestWaitingAgeMs: peak.oldestWaitingAgeMs,
      capacityHeadroom: peak.capacityHeadroom,
      estimatedDrainMinutes: peak.estimatedDrainMinutes,
      recommendation: peak.recommendation,
      stableRecommendation: peak.stableRecommendation,
      recommendedWorkers: peak.recommendedWorkers,
    }) : null,
    firstPressure: firstPressure ? Object.freeze({
      observedAtMs: firstPressure.observedAtMs,
      recommendation: firstPressure.recommendation,
      stableRecommendation: firstPressure.stableRecommendation,
      recommendedWorkers: firstPressure.recommendedWorkers,
      queuePressure: firstPressure.queuePressure,
      waitingPerWorker: firstPressure.waitingPerWorker,
      oldestWaitingAgeMs: firstPressure.oldestWaitingAgeMs,
    }) : null,
    firstStableScaleOut: firstStableScaleOut ? Object.freeze({
      observedAtMs: firstStableScaleOut.observedAtMs,
      stableRecommendation: firstStableScaleOut.stableRecommendation,
      recommendedWorkers: firstStableScaleOut.recommendedWorkers,
    }) : null,
    drainPrediction,
    gates: Object.freeze({
      noWorkerMutation,
      noUnsafeScaleIn,
      pressureDecisionValid,
      hysteresisObserved,
      admissionAccountingPass,
      completionPass,
      drainPredictionPass,
    }),
    pass,
  });
}
