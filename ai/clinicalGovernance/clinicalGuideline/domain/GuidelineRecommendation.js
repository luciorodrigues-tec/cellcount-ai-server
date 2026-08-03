export const GUIDELINE_RECOMMENDATION_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineRecommendation({
  recommendationId,
  text,
  evidenceLevel,
  strength,
  requiresHumanReview = false,
  metadata = {},
} = {}) {
  if (!recommendationId || !text) {
    throw new TypeError(
      "GuidelineRecommendation requires recommendationId and text.",
    );
  }

  if (!evidenceLevel || !strength) {
    throw new TypeError(
      "GuidelineRecommendation requires evidenceLevel and strength.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_RECOMMENDATION_SCHEMA_VERSION,
    recommendationId:
      String(recommendationId).trim(),
    text: String(text).trim(),
    evidenceLevel,
    strength,
    requiresHumanReview:
      Boolean(requiresHumanReview),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
