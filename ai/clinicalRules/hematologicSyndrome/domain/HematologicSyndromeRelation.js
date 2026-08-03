export const HEMATOLOGIC_SYNDROME_RELATION_SCHEMA_VERSION =
  "CRR-000027-v1";

export const HEMATOLOGIC_SYNDROME_RELATION_TYPES =
  Object.freeze([
    "IS_A",
    "OVERLAPS_WITH",
    "MAY_MIMIC",
    "EXCLUDES",
    "ASSOCIATED_WITH",
    "PROGRESSES_TO",
    "CO_OCCURS_WITH",
    "OTHER",
  ]);

export function createHematologicSyndromeRelation({
  id,
  sourceSyndromeId,
  targetSyndromeId,
  type,
  confidence = 1,
  bidirectional = false,
  evidenceSourceIds = [],
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    sourceSyndromeId,
    targetSyndromeId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `HematologicSyndromeRelation.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  if (!HEMATOLOGIC_SYNDROME_RELATION_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported hematologic syndrome relation type: ${normalizedType}`,
    );
  }

  const numericConfidence = Number(confidence);
  if (
    !Number.isFinite(numericConfidence) ||
    numericConfidence < 0 ||
    numericConfidence > 1
  ) {
    throw new TypeError(
      "HematologicSyndromeRelation.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      HEMATOLOGIC_SYNDROME_RELATION_SCHEMA_VERSION,
    id: String(id).trim(),
    sourceSyndromeId: String(sourceSyndromeId).trim(),
    targetSyndromeId: String(targetSyndromeId).trim(),
    type: normalizedType,
    confidence: numericConfidence,
    bidirectional: Boolean(bidirectional),
    evidenceSourceIds: Object.freeze([
      ...new Set(
        (Array.isArray(evidenceSourceIds) ? evidenceSourceIds : [])
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
