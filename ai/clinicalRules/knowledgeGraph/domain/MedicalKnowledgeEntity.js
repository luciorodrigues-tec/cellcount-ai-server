export const MEDICAL_KNOWLEDGE_ENTITY_SCHEMA_VERSION =
  "CRR-000014-v1";

export const MEDICAL_KNOWLEDGE_ENTITY_TYPES =
  Object.freeze([
    "DISEASE",
    "MORPHOLOGIC_FINDING",
    "CELL_TYPE",
    "IMMUNOPHENOTYPE_MARKER",
    "CYTOGENETIC_FINDING",
    "MOLECULAR_VARIANT",
    "LABORATORY_TEST",
    "SPECIMEN",
    "GUIDELINE",
    "CLASSIFICATION",
    "DIFFERENTIAL_DIAGNOSIS",
    "CLINICAL_FEATURE",
    "TREATMENT",
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

export function createMedicalKnowledgeEntity({
  id,
  type,
  label,
  aliases = [],
  description = "",
  ontologyCode = null,
  ontologySystem = null,
  version = "1.0.0",
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    type,
    label,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MedicalKnowledgeEntity.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type)
    .trim()
    .toUpperCase();

  if (
    !MEDICAL_KNOWLEDGE_ENTITY_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported medical knowledge entity type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      MEDICAL_KNOWLEDGE_ENTITY_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    label: String(label).trim(),
    aliases: uniqueStrings(aliases),
    description: String(description || "").trim(),
    ontologyCode:
      ontologyCode === null
        ? null
        : String(ontologyCode).trim(),
    ontologySystem:
      ontologySystem === null
        ? null
        : String(ontologySystem).trim(),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
