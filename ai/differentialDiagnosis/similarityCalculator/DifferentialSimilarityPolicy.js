export const DIFFERENTIAL_SIMILARITY_VERSION =
  "CI-002D.3-v1";

export const DefaultDifferentialSimilarityPolicy =
  Object.freeze({
    baselineWeight: 0.25,
    sharedAgreementWeight: 0.25,
    rankingSupportWeight: 0.15,
    confidenceSupportWeight: 0.15,
    coverageWeight: 0.10,
    specimenCompatibilityWeight: 0.10,

    primaryExclusiveConflictWeight: 0.20,
    alternativeExclusiveConflictWeight: 0.20,
    exclusionConflictWeight: 0.35,

    minimumObservedConfidence: 0.15,
    confidenceIntervalBaseRadius: 0.08,
    confidenceIntervalCoverageFactor: 0.08,
    clampOutput: true,
  });

export function mergeDifferentialSimilarityPolicy(
  override = {},
) {
  const merged = {
    ...DefaultDifferentialSimilarityPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys =
    Object.keys(
      DefaultDifferentialSimilarityPolicy,
    ).filter(
      (key) =>
        typeof DefaultDifferentialSimilarityPolicy[key] ===
        "number",
    );

  for (const key of numericKeys) {
    const value =
      Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid differential similarity policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  const positiveWeightSum =
    merged.baselineWeight +
    merged.sharedAgreementWeight +
    merged.rankingSupportWeight +
    merged.confidenceSupportWeight +
    merged.coverageWeight +
    merged.specimenCompatibilityWeight;

  if (
    Math.abs(
      positiveWeightSum - 1,
    ) > 0.000001
  ) {
    throw new TypeError(
      `Positive similarity weights must sum to 1. Current: ${positiveWeightSum}`,
    );
  }

  return Object.freeze(merged);
}
