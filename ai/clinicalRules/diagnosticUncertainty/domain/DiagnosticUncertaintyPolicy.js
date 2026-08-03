export const DIAGNOSTIC_UNCERTAINTY_POLICY_VERSION =
  "CRR-000031-v1.0.0";

export const DEFAULT_DIAGNOSTIC_UNCERTAINTY_POLICY =
  Object.freeze({
    version:
      DIAGNOSTIC_UNCERTAINTY_POLICY_VERSION,
    confidenceWeight: 0.35,
    competitionWeight: 0.2,
    evidenceGapWeight: 0.2,
    observationWeight: 0.15,
    conflictWeight: 0.1,
    lowImageQualityThreshold: 0.45,
    lowConsistencyThreshold: 0.5,
    highUncertaintyThreshold: 0.65,
    criticalUncertaintyThreshold: 0.85,
    maximumFactors: 50,
    maximumRecommendations: 10,
    requireHumanReviewOnHighUncertainty: true,
    blockAutomationOnCriticalUncertainty: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnMissingData: true,
  });

export function mergeDiagnosticUncertaintyPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_UNCERTAINTY_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
