export const MORPHOLOGIC_PATTERN_RELATION_SCHEMA_VERSION =
  "CRR-000026-v1";

export const MORPHOLOGIC_PATTERN_RELATION_TYPES =
  Object.freeze([
    "IS_A",
    "DERIVED_FROM",
    "OVERLAPS_WITH",
    "MAY_MIMIC",
    "EXCLUDES",
    "CO_OCCURS_WITH",
    "ASSOCIATED_WITH",
    "BROADER_THAN",
    "NARROWER_THAN",
    "OTHER",
  ]);

export function createMorphologicPatternRelation({
  id,
  sourcePatternId,
  targetPatternId,
  type,
  confidence = 1,
  bidirectional = false,
  evidenceSourceIds = [],
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    sourcePatternId,
    targetPatternId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MorphologicPatternRelation.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();

  if (!MORPHOLOGIC_PATTERN_RELATION_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported morphologic pattern relation type: ${normalizedType}`,
    );
  }

  const numericConfidence = Number(confidence);

  if (
    !Number.isFinite(numericConfidence) ||
    numericConfidence < 0 ||
    numericConfidence > 1
  ) {
    throw new TypeError(
      "MorphologicPatternRelation.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      MORPHOLOGIC_PATTERN_RELATION_SCHEMA_VERSION,
    id: String(id).trim(),
    sourcePatternId: String(sourcePatternId).trim(),
    targetPatternId: String(targetPatternId).trim(),
    type: normalizedType,
    confidence: numericConfidence,
    bidirectional: Boolean(bidirectional),
    evidenceSourceIds: Object.freeze([
      ...new Set(
        (Array.isArray(evidenceSourceIds)
          ? evidenceSourceIds
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
