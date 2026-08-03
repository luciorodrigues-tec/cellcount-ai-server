export const DIFFERENTIAL_RULE_VERSION =
  "CI-002D.1-v1";

function freezeUniqueStrings(
  values = [],
) {
  return Object.freeze([
    ...new Set(
      (Array.isArray(values)
        ? values
        : [])
        .map(String)
        .map(
          (item) =>
            item.trim(),
        )
        .filter(Boolean),
    ),
  ]);
}

function freezeObjects(
  values = [],
) {
  return Object.freeze(
    (Array.isArray(values)
      ? values
      : [])
      .map(
        (item) =>
          Object.freeze({
            ...(item &&
            typeof item === "object"
              ? item
              : {}),
          }),
      ),
  );
}

export function createDifferentialRule({
  id,
  version = "1.0.0",
  primaryCell,
  differentialCell,
  similarity = 0,
  specimenTypes = [],
  sharedFeatures = [],
  primaryExclusiveFeatures = [],
  differentialExclusiveFeatures = [],
  primaryExclusionFeatures = [],
  differentialExclusionFeatures = [],
  recommendedTests = [],
  confidenceModifiers = {},
  narrative = "",
  references = [],
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError(
      "DifferentialRule.id is required.",
    );
  }

  if (
    !primaryCell ||
    !String(primaryCell).trim()
  ) {
    throw new TypeError(
      "DifferentialRule.primaryCell is required.",
    );
  }

  if (
    !differentialCell ||
    !String(differentialCell).trim()
  ) {
    throw new TypeError(
      "DifferentialRule.differentialCell is required.",
    );
  }

  if (
    String(primaryCell).trim() ===
    String(differentialCell).trim()
  ) {
    throw new TypeError(
      "Differential rule cells must be different.",
    );
  }

  const safeSimilarity =
    Number(similarity);

  if (
    !Number.isFinite(safeSimilarity) ||
    safeSimilarity < 0 ||
    safeSimilarity > 1
  ) {
    throw new TypeError(
      "Differential similarity must be between 0 and 1.",
    );
  }

  return Object.freeze({
    id:
      String(id).trim(),
    version:
      String(version).trim(),
    engineVersion:
      DIFFERENTIAL_RULE_VERSION,
    primaryCell:
      String(primaryCell).trim(),
    differentialCell:
      String(differentialCell).trim(),
    similarity:
      safeSimilarity,
    specimenTypes:
      freezeUniqueStrings(
        specimenTypes,
      ),
    sharedFeatures:
      freezeUniqueStrings(
        sharedFeatures,
      ),
    primaryExclusiveFeatures:
      freezeUniqueStrings(
        primaryExclusiveFeatures,
      ),
    differentialExclusiveFeatures:
      freezeUniqueStrings(
        differentialExclusiveFeatures,
      ),
    primaryExclusionFeatures:
      freezeUniqueStrings(
        primaryExclusionFeatures,
      ),
    differentialExclusionFeatures:
      freezeUniqueStrings(
        differentialExclusionFeatures,
      ),
    recommendedTests:
      freezeObjects(
        recommendedTests,
      ),
    confidenceModifiers:
      Object.freeze({
        ...(confidenceModifiers &&
        typeof confidenceModifiers ===
          "object"
          ? confidenceModifiers
          : {}),
      }),
    narrative:
      String(narrative || "").trim(),
    references:
      freezeObjects(references),
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
