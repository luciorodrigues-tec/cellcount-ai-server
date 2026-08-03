function clamp01(value) {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

export function buildObservedFeatureIndex(
  detectedFeatures = {},
) {
  const index = new Map();

  if (
    Array.isArray(detectedFeatures)
  ) {
    for (
      const item
      of detectedFeatures
    ) {
      const featureId =
        String(
          item?.featureId ||
          item?.id ||
          "",
        ).trim();

      if (!featureId) {
        continue;
      }

      const confidence =
        clamp01(
          item?.confidence ??
          item?.value ??
          1,
        );

      index.set(
        featureId,
        Math.max(
          index.get(featureId) || 0,
          confidence,
        ),
      );
    }

    return index;
  }

  if (
    detectedFeatures &&
    typeof detectedFeatures === "object"
  ) {
    for (
      const [featureId, value]
      of Object.entries(
        detectedFeatures,
      )
    ) {
      const confidence =
        typeof value === "object"
          ? clamp01(
              value?.confidence ??
              value?.value ??
              0,
            )
          : clamp01(value);

      index.set(
        featureId,
        Math.max(
          index.get(featureId) || 0,
          confidence,
        ),
      );
    }
  }

  return index;
}

export function featureConfidence(
  featureIndex,
  featureId,
) {
  return Number(
    featureIndex.get(featureId) || 0,
  );
}
