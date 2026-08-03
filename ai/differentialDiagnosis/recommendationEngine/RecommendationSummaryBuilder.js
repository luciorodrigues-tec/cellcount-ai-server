export function buildRecommendationSummary({
  recommendations,
  recommendedCorrelation,
  limitations,
  safetyStatement,
} = {}) {
  const primary =
    recommendations.find(
      (item) =>
        item.recommendationLevel ===
        "PRIMARY",
    ) ||
    recommendations[0] ||
    null;

  const alternatives =
    recommendations.filter(
      (item) =>
        item !== primary,
    );

  const confidences =
    recommendations.map(
      (item) =>
        Number(item.confidence || 0),
    );

  return Object.freeze({
    primaryRecommendation:
      primary,
    alternativeRecommendations:
      Object.freeze(alternatives),
    recommendedCorrelation:
      Object.freeze([
        ...recommendedCorrelation,
      ]),
    limitations:
      Object.freeze([
        ...limitations,
      ]),
    confidenceStatement:
      primary
        ? `Confiança da recomendação principal: ${Math.round(primary.confidence * 100)}%.`
        : "Sem recomendação principal disponível.",
    safetyStatement,
    statistics:
      Object.freeze({
        recommendationCount:
          recommendations.length,
        primary:
          recommendations.filter(
            (item) =>
              item.recommendationLevel ===
              "PRIMARY",
          ).length,
        secondary:
          recommendations.filter(
            (item) =>
              item.recommendationLevel ===
              "SECONDARY",
          ).length,
        tertiary:
          recommendations.filter(
            (item) =>
              item.recommendationLevel ===
              "TERTIARY",
          ).length,
        unlikely:
          recommendations.filter(
            (item) =>
              item.recommendationLevel ===
              "UNLIKELY",
          ).length,
        averageConfidence:
          confidences.length
            ? Number(
                (
                  confidences.reduce(
                    (sum, value) =>
                      sum + value,
                    0,
                  ) /
                  confidences.length
                ).toFixed(6),
              )
            : 0,
        highestConfidence:
          confidences.length
            ? Math.max(
                ...confidences,
              )
            : 0,
      }),
  });
}
