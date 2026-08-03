export const EXCLUSIVE_FEATURE_ENGINE_VERSION =
  "CI-002D.5-v1";

export const ExclusiveFeatureClass =
  Object.freeze({
    pathognomonic: "PATHOGNOMONIC",
    veryHigh: "VERY_HIGH",
    high: "HIGH",
    moderate: "MODERATE",
    low: "LOW",
    nonDiscriminative:
      "NON_DISCRIMINATIVE",
  });

export const DefaultExclusiveFeaturePolicy =
  Object.freeze({
    specificityWeight: 0.35,
    sensitivityWeight: 0.25,
    evidenceWeight: 0.25,
    confidenceWeight: 0.15,
    crossLineagePenaltyWeight: 0.20,
    pathognomonicThreshold: 0.92,
    veryHighThreshold: 0.80,
    highThreshold: 0.65,
    moderateThreshold: 0.45,
    lowThreshold: 0.20,
    minimumObservedConfidence: 0.15,
    maxFeaturesPerGroup: 20,
    includeMissingExclusiveFeatures: true,
    includeSharedFeatures: true,
  });

export function mergeExclusiveFeaturePolicy(
  override = {},
) {
  const merged = {
    ...DefaultExclusiveFeaturePolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys =
    Object.keys(
      DefaultExclusiveFeaturePolicy,
    ).filter(
      (key) =>
        typeof DefaultExclusiveFeaturePolicy[key] ===
        "number",
    );

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid exclusive feature policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const weightSum =
    merged.specificityWeight +
    merged.sensitivityWeight +
    merged.evidenceWeight +
    merged.confidenceWeight;

  if (
    Math.abs(weightSum - 1) >
    0.000001
  ) {
    throw new TypeError(
      `Exclusive feature weights must sum to 1. Current: ${weightSum}`,
    );
  }

  const ordered = [
    merged.pathognomonicThreshold,
    merged.veryHighThreshold,
    merged.highThreshold,
    merged.moderateThreshold,
    merged.lowThreshold,
  ];

  for (
    let index = 1;
    index < ordered.length;
    index += 1
  ) {
    if (
      ordered[index - 1] <
      ordered[index]
    ) {
      throw new TypeError(
        "Exclusive feature thresholds must be monotonically descending.",
      );
    }
  }

  if (
    !Number.isInteger(
      merged.maxFeaturesPerGroup,
    )
  ) {
    throw new TypeError(
      "maxFeaturesPerGroup must be an integer.",
    );
  }

  return Object.freeze(merged);
}
