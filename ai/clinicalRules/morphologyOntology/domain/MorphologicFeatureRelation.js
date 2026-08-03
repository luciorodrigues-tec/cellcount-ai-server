export const MORPHOLOGIC_FEATURE_RELATION_SCHEMA_VERSION =
  "CRR-000018-v1";

export const MORPHOLOGIC_FEATURE_RELATION_TYPES =
  Object.freeze([
    "IS_A",
    "BROADER_THAN",
    "NARROWER_THAN",
    "EQUIVALENT_TO",
    "RELATED_TO",
    "PART_OF",
    "DERIVED_FROM",
    "ASSOCIATED_WITH",
    "SUPPORTS",
    "CONTRADICTS",
    "CO_OCCURS_WITH",
    "MUTUALLY_EXCLUSIVE_WITH",
    "MAY_MIMIC",
    "OTHER",
  ]);

export function createMorphologicFeatureRelation({
  id,
  sourceFeatureId,
  targetFeatureId,
  type,
  bidirectional = false,
  confidence = 1,
  referenceIds = [],
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    sourceFeatureId,
    targetFeatureId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MorphologicFeatureRelation.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type)
    .trim()
    .toUpperCase();

  if (
    !MORPHOLOGIC_FEATURE_RELATION_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported morphologic feature relation type: ${normalizedType}`,
    );
  }

  const numericConfidence = Number(confidence);

  if (
    !Number.isFinite(numericConfidence) ||
    numericConfidence < 0 ||
    numericConfidence > 1
  ) {
    throw new TypeError(
      "MorphologicFeatureRelation.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      MORPHOLOGIC_FEATURE_RELATION_SCHEMA_VERSION,
    id: String(id).trim(),
    sourceFeatureId: String(sourceFeatureId).trim(),
    targetFeatureId: String(targetFeatureId).trim(),
    type: normalizedType,
    bidirectional: Boolean(bidirectional),
    confidence: numericConfidence,
    referenceIds: Object.freeze([
      ...new Set(
        (Array.isArray(referenceIds)
          ? referenceIds
          : []
        )
          .map(String)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ]),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
