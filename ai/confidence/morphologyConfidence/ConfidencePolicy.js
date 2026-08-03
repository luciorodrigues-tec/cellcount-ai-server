export const MORPHOLOGY_CONFIDENCE_VERSION =
  "CI-002C.6-v1";

export const ConfidenceLevel =
  Object.freeze({
    veryHigh: "VERY_HIGH",
    high: "HIGH",
    moderate: "MODERATE",
    low: "LOW",
    veryLow: "VERY_LOW",
    unavailable: "UNAVAILABLE",
  });

export const DefaultConfidencePolicy =
  Object.freeze({
    winnerScoreWeight: 0.35,
    coverageWeight: 0.25,
    marginWeight: 0.20,
    requiredCoverageWeight: 0.20,

    ambiguityPenalty: 0.18,
    tiePenalty: 0.25,
    lowDominancePenalty: 0.08,
    limitationPenaltyFactor: 0.08,
    negativePenaltyFactor: 0.05,
    exclusionPenaltyFactor: 0.20,
    requiredPenaltyFactor: 0.10,
    weakWinnerPenalty: 0.15,
    rankingReviewPenalty: 0.10,

    humanReviewThreshold: 0.55,

    veryHighThreshold: 0.90,
    highThreshold: 0.75,
    moderateThreshold: 0.55,
    lowThreshold: 0.35,

    clampScore: true,
  });

export function mergeConfidencePolicy(
  override = {},
) {
  const merged = {
    ...DefaultConfidencePolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys = Object.keys(
    DefaultConfidencePolicy,
  ).filter(
    (key) =>
      typeof DefaultConfidencePolicy[key] === "number",
  );

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid confidence policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const weightSum =
    merged.winnerScoreWeight +
    merged.coverageWeight +
    merged.marginWeight +
    merged.requiredCoverageWeight;

  if (
    Math.abs(weightSum - 1) > 0.000001
  ) {
    throw new TypeError(
      `Confidence positive weights must sum to 1. Current: ${weightSum}`,
    );
  }

  if (
    !(
      merged.veryHighThreshold >=
      merged.highThreshold &&
      merged.highThreshold >=
      merged.moderateThreshold &&
      merged.moderateThreshold >=
      merged.lowThreshold
    )
  ) {
    throw new TypeError(
      "Confidence level thresholds must be monotonically descending.",
    );
  }

  return Object.freeze(merged);
}
