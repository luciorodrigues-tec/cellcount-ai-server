export const DIAGNOSTIC_CRITERIA_POLICY_VERSION =
  "CRR-000019-v1.0.0";

export const DEFAULT_DIAGNOSTIC_CRITERIA_POLICY =
  Object.freeze({
    version: DIAGNOSTIC_CRITERIA_POLICY_VERSION,
    rejectUnknownCriteria: true,
    rejectCrossClassificationCriteria: true,
    exclusionOverridesByDefault: true,
    requireAllRequiredCriteria: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnIndeterminate: true,
  });

export function mergeDiagnosticCriteriaPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_CRITERIA_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
