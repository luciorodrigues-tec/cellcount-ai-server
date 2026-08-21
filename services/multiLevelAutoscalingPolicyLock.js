export const MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION = 'INF-SCALE-001.2H-E';
export const AUTOSCALING_POLICY_STATUS = 'LOCKED_SAFE';
export const REQUIRED_LEVELS = Object.freeze([25, 50, 100]);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function evaluateMultiLevelAutoscalingPolicy({ calibrations = [], requiredLevels = REQUIRED_LEVELS } = {}) {
  const byLevel = new Map(calibrations.map((item) => [Number(item?.level), item]));
  const levelResults = requiredLevels.map((level) => {
    const item = byLevel.get(Number(level));
    const calibration = item?.calibration || {};
    const stage = item?.stage || {};
    const gates = calibration?.gates || {};
    const present = Boolean(item);
    const zeroDuplicates = finite(stage?.duplicateAnalysisIds) === 0;
    const zeroTerminalFailures = finite(stage?.terminalFailures) === 0;
    const zeroUnexpectedErrors = finite(stage?.unexpectedErrors) === 0;
    const accountingComplete = finite(stage?.accounted) === finite(stage?.submitted) && finite(stage?.submitted) > 0;
    const singleAttemptCleanPath = finite(stage?.maxAttempts, 1) <= 1;
    const pass = present && item?.success === true && stage?.pass === true && calibration?.pass === true &&
      gates?.noWorkerMutation === true && gates?.noUnsafeScaleIn === true &&
      gates?.pressureDecisionValid === true && gates?.admissionAccountingPass === true &&
      gates?.completionPass === true && gates?.drainPredictionPass === true &&
      zeroDuplicates && zeroTerminalFailures && zeroUnexpectedErrors && accountingComplete && singleAttemptCleanPath;
    return Object.freeze({
      level, present, pass, zeroDuplicates, zeroTerminalFailures, zeroUnexpectedErrors,
      accountingComplete, singleAttemptCleanPath,
      observedThroughputPerMinute: finite(calibration?.observedThroughputPerMinute),
      peakActive: finite(calibration?.peak?.active),
      peakQueuePressure: finite(calibration?.peak?.queuePressure),
      stableScaleOutObserved: Boolean(calibration?.firstStableScaleOut),
      drainPredictionPass: gates?.drainPredictionPass === true,
    });
  });

  const multiLevelCalibrationPass = levelResults.every((x) => x.pass);
  const zeroUnsafeScaleIn = calibrations.every((x) => x?.calibration?.gates?.noUnsafeScaleIn === true);
  const zeroDuplicateAnalysisIds = calibrations.every((x) => finite(x?.stage?.duplicateAnalysisIds) === 0);
  const zeroTerminalFailures = calibrations.every((x) => finite(x?.stage?.terminalFailures) === 0);
  const zeroUnexpectedErrors = calibrations.every((x) => finite(x?.stage?.unexpectedErrors) === 0);
  const drainPredictionWithinTolerance = calibrations.every((x) => x?.calibration?.gates?.drainPredictionPass === true);
  const hysteresisStable = calibrations.every((x) => x?.calibration?.gates?.hysteresisObserved === true);
  const admissionAccountingComplete = calibrations.every((x) => x?.calibration?.gates?.admissionAccountingPass === true);
  const noWorkerMutation = calibrations.every((x) => x?.calibration?.gates?.noWorkerMutation === true);
  const allRequiredLevelsPresent = requiredLevels.every((level) => byLevel.has(Number(level)));
  const certificationPass = allRequiredLevelsPresent && multiLevelCalibrationPass && zeroUnsafeScaleIn &&
    zeroDuplicateAnalysisIds && zeroTerminalFailures && zeroUnexpectedErrors && drainPredictionWithinTolerance &&
    hysteresisStable && admissionAccountingComplete && noWorkerMutation;

  return Object.freeze({
    version: MULTI_LEVEL_AUTOSCALING_POLICY_LOCK_VERSION,
    autoscalingPolicyStatus: AUTOSCALING_POLICY_STATUS,
    automaticScalingAllowed: false,
    mutatesWorkerCount: false,
    recommendationOnly: true,
    requiredLevels: [...requiredLevels],
    levelResults,
    gates: Object.freeze({
      allRequiredLevelsPresent, multiLevelCalibrationPass, zeroUnsafeScaleIn, zeroDuplicateAnalysisIds,
      zeroTerminalFailures, zeroUnexpectedErrors, drainPredictionWithinTolerance, hysteresisStable,
      admissionAccountingComplete, noWorkerMutation,
    }),
    requiredBeforeAutomaticScaling: Object.freeze({
      multiLevelCalibrationPass: certificationPass,
      zeroUnsafeScaleIn,
      zeroDuplicateAnalysisIds,
      zeroTerminalFailures,
      zeroUnexpectedErrors,
      drainPredictionWithinTolerance,
      hysteresisStable,
      admissionAccountingComplete,
      noWorkerMutation,
      separateExplicitAutoscalingActivationSprintRequired: true,
    }),
    pass: certificationPass,
  });
}
