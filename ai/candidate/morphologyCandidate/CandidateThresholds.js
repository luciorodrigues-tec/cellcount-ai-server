export const CANDIDATE_GENERATOR_VERSION =
  "CI-002C.4-v1";

export const DefaultCandidateThresholds =
  Object.freeze({
    minimumCandidateScore: 1.0,
    minimumNormalizedScore: 0.25,
    minimumCoverage: 0.40,
    requireRequiredSatisfied: true,
    requireMinimumScoreSatisfied: false,
    allowExcluded: false,
    allowBlocked: false,
    maxEligibleCandidates: 15,
  });

export function mergeCandidateThresholds(
  override = {},
) {
  const merged = {
    ...DefaultCandidateThresholds,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys = [
    "minimumCandidateScore",
    "minimumNormalizedScore",
    "minimumCoverage",
    "maxEligibleCandidates",
  ];

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid candidate threshold ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  return Object.freeze(merged);
}
