export const MEDICAL_KNOWLEDGE_RELATION_SCHEMA_VERSION =
  "CRR-000014-v1";

export const MEDICAL_KNOWLEDGE_RELATION_TYPES =
  Object.freeze([
    "IS_A",
    "HAS_FINDING",
    "ASSOCIATED_WITH",
    "SUPPORTS",
    "OPPOSES",
    "EXCLUDES",
    "REQUIRES_TEST",
    "CONFIRMED_BY",
    "CLASSIFIED_BY",
    "DEFINED_BY",
    "EXPRESSED_BY",
    "HAS_VARIANT",
    "HAS_IMMUNOPHENOTYPE",
    "HAS_CYTOGENETIC_FINDING",
    "DIFFERENTIAL_OF",
    "DERIVED_FROM",
    "APPLIES_TO_SPECIMEN",
    "OTHER",
  ]);

export function createMedicalKnowledgeRelation({
  id,
  sourceEntityId,
  targetEntityId,
  type,
  direction = "DIRECTED",
  weight = 1,
  confidence = 1,
  evidenceSourceIds = [],
  version = "1.0.0",
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    sourceEntityId,
    targetEntityId,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MedicalKnowledgeRelation.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type)
    .trim()
    .toUpperCase();

  if (
    !MEDICAL_KNOWLEDGE_RELATION_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported medical knowledge relation type: ${normalizedType}`,
    );
  }

  const numericWeight = Number(weight);
  const numericConfidence = Number(confidence);

  if (
    !Number.isFinite(numericWeight) ||
    numericWeight < 0
  ) {
    throw new TypeError(
      "MedicalKnowledgeRelation.weight must be non-negative.",
    );
  }

  if (
    !Number.isFinite(numericConfidence) ||
    numericConfidence < 0 ||
    numericConfidence > 1
  ) {
    throw new TypeError(
      "MedicalKnowledgeRelation.confidence must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      MEDICAL_KNOWLEDGE_RELATION_SCHEMA_VERSION,
    id: String(id).trim(),
    sourceEntityId: String(sourceEntityId).trim(),
    targetEntityId: String(targetEntityId).trim(),
    type: normalizedType,
    direction: String(direction).trim().toUpperCase(),
    weight: numericWeight,
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
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
