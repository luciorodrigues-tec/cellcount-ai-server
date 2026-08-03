export function createRecommendationResult({
  version,
  pairId,
  recommendations = [],
  explanation = {},
  summary = {},
  safetyValidation = {},
  metadata = {},
} = {}) {
  return Object.freeze({
    version,
    pairId,
    recommendations:
      Object.freeze([
        ...recommendations,
      ]),
    explanation:
      Object.freeze({
        ...explanation,
      }),
    summary,
    safetyValidation,
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
