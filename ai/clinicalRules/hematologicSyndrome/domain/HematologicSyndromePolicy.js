export const HEMATOLOGIC_SYNDROME_POLICY_VERSION =
  "CRR-000027-v1.0.0";

export const DEFAULT_HEMATOLOGIC_SYNDROME_POLICY =
  Object.freeze({
    version:
      HEMATOLOGIC_SYNDROME_POLICY_VERSION,
    rejectUnknownRelationEndpoints: true,
    allowSelfRelations: false,
    requiredPatternWeight: 1,
    supportivePatternWeight: 0.5,
    requiredFeatureWeight: 0.5,
    supportiveFeatureWeight: 0.25,
    exclusionPenalty: 1,
    maximumResults: 20,
    requireHumanReviewOnTie: true,
    requireHumanReviewOnExclusionConflict: true,
  });

export function mergeHematologicSyndromePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_HEMATOLOGIC_SYNDROME_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
