export const MORPHOLOGY_SCORE_VERSION =
  "CI-002C.3-v1";

export const DefaultScorePolicy =
  Object.freeze({
    requiredMultiplier: 1.2,
    supportiveMultiplier: 1.0,
    negativePenaltyMultiplier: 1.0,
    exclusionPenaltyMultiplier: 2.0,
    limitationPenaltyMultiplier: 0.25,
    limitationBaseWeight: 1,
    missingRequiredPenaltyMultiplier: 0.75,
    exclusionBlocks: true,
    minimumSimilarity: 0.8,
    clampNormalizedScore: true,
  });

export function mergeScorePolicy(
  override = {},
) {
  return Object.freeze({
    ...DefaultScorePolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  });
}
