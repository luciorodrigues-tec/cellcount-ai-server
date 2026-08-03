function average(
  items,
  selector,
) {
  if (!items.length) {
    return 0;
  }

  return Number(
    (
      items.reduce(
        (sum, item) =>
          sum +
          Number(selector(item) || 0),
        0,
      ) /
      items.length
    ).toFixed(6),
  );
}

export function aggregateRecommendationEvidence(
  conflictResult,
  exclusiveFeatureResult,
) {
  const features =
    exclusiveFeatureResult?.features || [];

  const primary =
    features.filter(
      (item) =>
        item.favors ===
          exclusiveFeatureResult
            .primaryCell &&
        item.observed === true,
    );

  const alternative =
    features.filter(
      (item) =>
        item.favors ===
          exclusiveFeatureResult
            .alternativeCell &&
        item.observed === true,
    );

  const shared =
    features.filter(
      (item) =>
        item.favors === "BOTH" &&
        item.observed === true,
    );

  const missing =
    features.filter(
      (item) =>
        item.missing === true,
    );

  return Object.freeze({
    primary:
      Object.freeze(primary),
    alternative:
      Object.freeze(alternative),
    shared:
      Object.freeze(shared),
    missing:
      Object.freeze(missing),
    primaryDiscrimination:
      average(
        primary,
        (item) =>
          item.discriminationScore,
      ),
    alternativeDiscrimination:
      average(
        alternative,
        (item) =>
          item.discriminationScore,
      ),
    conflictPenalty:
      Number(
        conflictResult
          ?.severity
          ?.score || 0,
      ),
  });
}
