export const MORPHOLOGY_RANKING_VERSION =
  "CI-002C.5-v1";

export const RankingDominance =
  Object.freeze({
    none: "NONE",
    low: "LOW",
    moderate: "MODERATE",
    high: "HIGH",
  });

export const DefaultRankingPolicy =
  Object.freeze({
    dominanceHighThreshold: 0.15,
    dominanceModerateThreshold: 0.05,
    ambiguityThreshold: 0.03,
    minimumWinnerNormalizedScore: 0.25,
    minimumWinnerScore: 1.0,
    minimumWinnerCoverage: 0.40,
    humanReviewOnSingleCandidate: false,
    humanReviewOnNoCandidate: true,
    humanReviewOnAmbiguity: true,
    humanReviewOnWeakWinner: true,
  });

export function mergeRankingPolicy(
  override = {},
) {
  const merged = {
    ...DefaultRankingPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys = [
    "dominanceHighThreshold",
    "dominanceModerateThreshold",
    "ambiguityThreshold",
    "minimumWinnerNormalizedScore",
    "minimumWinnerScore",
    "minimumWinnerCoverage",
  ];

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid ranking policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  if (
    merged.dominanceHighThreshold <
    merged.dominanceModerateThreshold
  ) {
    throw new TypeError(
      "dominanceHighThreshold must be greater than or equal to dominanceModerateThreshold.",
    );
  }

  if (
    merged.dominanceModerateThreshold <
    merged.ambiguityThreshold
  ) {
    throw new TypeError(
      "dominanceModerateThreshold must be greater than or equal to ambiguityThreshold.",
    );
  }

  return Object.freeze(merged);
}
