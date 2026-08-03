export const DIAGNOSTIC_RECOMMENDATION_POLICY_VERSION =
  "CRR-000022-v1.0.0";

export const DEFAULT_DIAGNOSTIC_RECOMMENDATION_POLICY =
  Object.freeze({
    version: DIAGNOSTIC_RECOMMENDATION_POLICY_VERSION,
    maximumRecommendations: 20,
    includeRoutineRecommendations: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnAbstention: true,
    requireHumanReviewOnCritical: true,
    blockAutomationOnCritical: true,
    deduplicateByAction: true,
  });

export function mergeDiagnosticRecommendationPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_RECOMMENDATION_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
