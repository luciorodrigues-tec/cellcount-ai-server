export const DIFFERENTIAL_RECOMMENDATION_VERSION =
  "CI-002D.7-v1";

export const RecommendationLevel =
  Object.freeze({
    primary: "PRIMARY",
    secondary: "SECONDARY",
    tertiary: "TERTIARY",
    lowPriority: "LOW_PRIORITY",
    unlikely: "UNLIKELY",
  });

export const DefaultRecommendationPolicy =
  Object.freeze({
    probabilityWeight: 0.45,
    discriminationWeight: 0.25,
    confidenceWeight: 0.20,
    conflictPenaltyWeight: 0.10,

    primaryThreshold: 0.75,
    secondaryThreshold: 0.55,
    tertiaryThreshold: 0.35,
    lowPriorityThreshold: 0.15,

    maximumAlternatives: 4,
    requireSafetyLanguage: true,
    includeRecommendedTests: true,
    includeLimitations: true,
  });

export function mergeRecommendationPolicy(
  override = {},
) {
  const merged = {
    ...DefaultRecommendationPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys =
    Object.keys(
      DefaultRecommendationPolicy,
    ).filter(
      (key) =>
        typeof DefaultRecommendationPolicy[key] ===
        "number",
    );

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid recommendation policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const sum =
    merged.probabilityWeight +
    merged.discriminationWeight +
    merged.confidenceWeight +
    merged.conflictPenaltyWeight;

  if (Math.abs(sum - 1) > 0.000001) {
    throw new TypeError(
      `Recommendation weights must sum to 1. Current: ${sum}`,
    );
  }

  if (
    !Number.isInteger(
      merged.maximumAlternatives,
    )
  ) {
    throw new TypeError(
      "maximumAlternatives must be an integer.",
    );
  }

  return Object.freeze(merged);
}
