export const MORPHOLOGY_EXPLANATION_VERSION =
  "CI-002C.7-v1";

export const DefaultExplanationPolicy =
  Object.freeze({
    maxSupportingEvidence: 8,
    maxContradictoryEvidence: 6,
    maxMissingRequiredEvidence: 6,
    maxAlternativeCandidates: 3,
    includeRejectedCandidates: true,
    includeScoreBreakdown: true,
    includeConfidenceBreakdown: true,
    includeClinicalSafetyLanguage: true,
    requireHumanReviewLanguage: true,
  });

export function mergeExplanationPolicy(
  override = {},
) {
  const merged = {
    ...DefaultExplanationPolicy,
    ...(override &&
    typeof override === "object"
      ? override
      : {}),
  };

  const numericKeys = [
    "maxSupportingEvidence",
    "maxContradictoryEvidence",
    "maxMissingRequiredEvidence",
    "maxAlternativeCandidates",
  ];

  for (const key of numericKeys) {
    const value = Number(merged[key]);

    if (
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw new TypeError(
        `Invalid explanation policy ${key}: ${merged[key]}`,
      );
    }

    merged[key] = value;
  }

  return Object.freeze(merged);
}
