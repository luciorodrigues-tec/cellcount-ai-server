export const QUALITY_RECOMMENDATION_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityRecommendation({
  recommendationId,
  text,
  priority = 100,
  relatedFindingIds = [],
  requiresHumanReview = false,
} = {}) {
  if (!recommendationId || !text) {
    throw new TypeError(
      "QualityRecommendation requires recommendationId and text.",
    );
  }

  const numericPriority = Number(priority);

  if (
    !Number.isInteger(numericPriority) ||
    numericPriority < 1
  ) {
    throw new TypeError(
      "QualityRecommendation.priority must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_RECOMMENDATION_SCHEMA_VERSION,
    recommendationId:
      String(recommendationId),
    text: String(text),
    priority: numericPriority,
    relatedFindingIds:
      Object.freeze([...relatedFindingIds]),
    requiresHumanReview:
      Boolean(requiresHumanReview),
  });
}
