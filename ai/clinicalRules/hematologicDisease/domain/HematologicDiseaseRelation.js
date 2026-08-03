export const HEMATOLOGIC_DISEASE_RELATION_SCHEMA_VERSION =
  "CRR-000025-v1";

export const HEMATOLOGIC_DISEASE_RELATION_TYPES =
  Object.freeze([
    "IS_A",
    "DIFFERENTIAL_OF",
    "ASSOCIATED_WITH",
    "HAS_MORPHOLOGIC_FEATURE",
    "HAS_CRITERIA_SET",
    "CONFIRMED_BY",
    "CLASSIFIED_BY",
    "MAY_MIMIC",
    "EXCLUDES",
    "OTHER",
  ]);

export function createHematologicDiseaseRelation({
  id,
  sourceDiseaseId,
  targetId,
  type,
  confidence = 1,
  evidenceSourceIds = [],
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    sourceDiseaseId,
    targetId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `HematologicDiseaseRelation.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (
    !HEMATOLOGIC_DISEASE_RELATION_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported hematologic disease relation type: ${normalizedType}`,
    );
  }

  const numericConfidence = Number(confidence);
  if (
    !Number.isFinite(numericConfidence) ||
    numericConfidence < 0 ||
    numericConfidence > 1
  ) {
    throw new TypeError(
      "HematologicDiseaseRelation.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      HEMATOLOGIC_DISEASE_RELATION_SCHEMA_VERSION,
    id: String(id).trim(),
    sourceDiseaseId:
      String(sourceDiseaseId).trim(),
    targetId: String(targetId).trim(),
    type: normalizedType,
    confidence: numericConfidence,
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
    status:
      String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
