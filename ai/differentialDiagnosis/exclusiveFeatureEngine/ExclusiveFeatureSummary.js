function average(
  items,
) {
  if (items.length === 0) {
    return 0;
  }

  return Number(
    (
      items.reduce(
        (sum, item) =>
          sum +
          Number(
            item
              .discriminationScore || 0,
          ),
        0,
      ) /
      items.length
    ).toFixed(6),
  );
}

export function buildExclusiveFeatureSummary(
  features = [],
) {
  const groups = {
    PATHOGNOMONIC: [],
    VERY_HIGH: [],
    HIGH: [],
    MODERATE: [],
    LOW: [],
    NON_DISCRIMINATIVE: [],
  };

  for (const feature of features) {
    groups[
      feature.classification
    ].push(feature);
  }

  const sorted =
    [...features].sort(
      (first, second) =>
        Number(
          second
            .discriminationScore || 0,
        ) -
        Number(
          first
            .discriminationScore || 0,
        ),
    );

  return Object.freeze({
    headline:
      sorted.length > 0
        ? `${sorted[0].featureId} apresentou o maior poder discriminativo.`
        : "Nenhuma feature exclusiva disponível.",
    groups:
      Object.freeze(
        Object.fromEntries(
          Object.entries(groups)
            .map(
              ([key, value]) => [
                key,
                Object.freeze(value),
              ],
            ),
        ),
      ),
    statistics:
      Object.freeze({
        total:
          features.length,
        pathognomonic:
          groups.PATHOGNOMONIC.length,
        veryHigh:
          groups.VERY_HIGH.length,
        high:
          groups.HIGH.length,
        moderate:
          groups.MODERATE.length,
        low:
          groups.LOW.length,
        nonDiscriminative:
          groups
            .NON_DISCRIMINATIVE
            .length,
        averageDiscrimination:
          average(features),
        maximumDiscrimination:
          sorted[0]
            ?.discriminationScore ||
          0,
      }),
    rankedFeatures:
      Object.freeze(sorted),
  });
}
