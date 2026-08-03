export const MORPHOLOGIC_PATTERN_POLICY_VERSION =
  "CRR-000026-v1.0.0";

export const DEFAULT_MORPHOLOGIC_PATTERN_POLICY =
  Object.freeze({
    version:
      MORPHOLOGIC_PATTERN_POLICY_VERSION,
    rejectUnknownParents: true,
    rejectUnknownRelationEndpoints: true,
    rejectHierarchyCycles: true,
    allowSelfRelations: false,
    maximumResults: 20,
    maximumTraversalDepth: 8,
    defaultSupportiveWeight: 0.5,
    defaultRequiredWeight: 1,
    exclusionPenalty: 1,
    requireHumanReviewOnTie: true,
    requireHumanReviewOnExclusionConflict: true,
  });

export function mergeMorphologicPatternPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_MORPHOLOGIC_PATTERN_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
