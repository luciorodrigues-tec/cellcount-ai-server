function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

function featureEntries(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      if (typeof item === "string") {
        return [
          item,
          {
            confidence: 1,
          },
        ];
      }

      return [
        item.featureId ||
        item.id ||
        item.name ||
        "",
        item,
      ];
    });
  }

  if (typeof input === "object") {
    return Object.entries(input);
  }

  return [];
}

export function normalizeDetectedFeatures(
  input,
  {
    aliasRegistry,
  } = {},
) {
  const normalized =
    new Map();

  for (
    const [rawId, rawValue]
    of featureEntries(input)
  ) {
    const featureId =
      aliasRegistry
        ?.resolve(rawId) ||
      String(rawId || "")
        .trim()
        .toLowerCase();

    if (!featureId) {
      continue;
    }

    const confidence =
      typeof rawValue === "number"
        ? clamp01(rawValue)
        : clamp01(
            rawValue?.confidence ??
            rawValue?.score ??
            rawValue?.probability ??
            1,
          );

    const previous =
      normalized.get(featureId);

    if (
      !previous ||
      confidence >
        previous.confidence
    ) {
      normalized.set(
        featureId,
        Object.freeze({
          featureId,
          confidence,
          rawId:
            String(rawId || ""),
          source:
            rawValue?.source ||
            "vision",
          metadata:
            rawValue?.metadata || {},
        }),
      );
    }
  }

  return normalized;
}
