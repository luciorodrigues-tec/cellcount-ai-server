export const CLINICAL_SAFETY_GATE_POLICY_VERSION =
  "CRR-000034-v1.0.0";

export const DEFAULT_CLINICAL_SAFETY_GATE_POLICY =
  Object.freeze({
    version:
      CLINICAL_SAFETY_GATE_POLICY_VERSION,
    minimumValidationScoreForRelease: 0.8,
    minimumConfidenceForRelease: 0.65,
    maximumUncertaintyForRelease: 0.35,
    requireValidatedStatus: true,
    requireReleaseAllowedFromValidation: true,
    blockOnConsensusDivergence: true,
    blockOnAbstention: true,
    blockOnDecisionTreeCycle: true,
    blockOnDisconnectedDecisionTree: true,
    blockOnCriticalAlert: true,
    requireHumanReviewOnHighAlert: true,
    requireHumanReviewOnUpstreamReview: true,
    blockOnAutomationConflict: true,
    maximumReasons: 100,
  });

export function mergeClinicalSafetyGatePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_CLINICAL_SAFETY_GATE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
