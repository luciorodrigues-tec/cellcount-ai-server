export const DIAGNOSTIC_KNOWLEDGE_ENTITY_SCHEMA_VERSION =
  "CRR-000015-v1";

export const DIAGNOSTIC_KNOWLEDGE_ENTITY_TYPES =
  Object.freeze([
    "DISEASE_ENTITY",
    "DISEASE_CATEGORY",
    "DIAGNOSTIC_CRITERION",
    "SUPPORTIVE_FINDING",
    "EXCLUSION_CRITERION",
    "RISK_GROUP",
    "PROGNOSTIC_FACTOR",
    "RECOMMENDED_TEST",
    "CLASSIFICATION_NODE",
    "OTHER",
  ]);

function uniqueStrings(values = []) {
  return Object.freeze([
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]);
}

export function createDiagnosticKnowledgeEntity({
  id,
  classificationId,
  type,
  label,
  code = null,
  parentEntityId = null,
  aliases = [],
  criterionRefs = [],
  evidenceSourceIds = [],
  status = "DRAFT",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    classificationId,
    type,
    label,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticKnowledgeEntity.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type)
    .trim()
    .toUpperCase();

  if (
    !DIAGNOSTIC_KNOWLEDGE_ENTITY_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported diagnostic knowledge entity type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_KNOWLEDGE_ENTITY_SCHEMA_VERSION,
    id: String(id).trim(),
    classificationId:
      String(classificationId).trim(),
    type: normalizedType,
    label: String(label).trim(),
    code:
      code === null ? null : String(code).trim(),
    parentEntityId:
      parentEntityId === null
        ? null
        : String(parentEntityId).trim(),
    aliases: uniqueStrings(aliases),
    criterionRefs: uniqueStrings(criterionRefs),
    evidenceSourceIds:
      uniqueStrings(evidenceSourceIds),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
