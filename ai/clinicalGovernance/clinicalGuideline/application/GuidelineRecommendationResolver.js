export const GUIDELINE_RECOMMENDATION_RESOLVER_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineRecommendationResolver {
  resolve(node, guideline) {
    const recommendations =
      guideline.recommendations.filter(
        (recommendation) =>
          node.recommendationIds.includes(
            recommendation.recommendationId,
          ),
      );

    const requiresHumanReview =
      recommendations.some(
        (recommendation) =>
          recommendation.requiresHumanReview,
      );

    return Object.freeze({
      recommendations:
        Object.freeze(recommendations),
      requiresHumanReview,
    });
  }
}
