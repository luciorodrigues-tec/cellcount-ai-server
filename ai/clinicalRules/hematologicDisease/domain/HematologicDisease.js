export const HEMATOLOGIC_DISEASE_SCHEMA_VERSION =
  "CRR-000025-v1";

export const HEMATOLOGIC_DISEASE_FAMILIES =
  Object.freeze([
    "MYELOID",
    "LYMPHOID",
    "PLASMA_CELL",
    "ERYTHROID",
    "MEGAKARYOCYTIC",
    "MARROW_FAILURE",
    "HEMOLYTIC",
    "COAGULATION",
    "BENIGN_REACTIVE",
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

export function createHematologicDisease({
  id,
  preferredName,
  family,
  aliases = [],
  classificationIds = [],
  parentDiseaseId = null,
  morphologyFeatureIds = [],
  diagnosticCriteriaSetIds = [],
  confirmatoryTestIds = [],
  differentialDiseaseIds = [],
  evidenceSourceIds = [],
  version = "1.0.0",
  status = "DRAFT",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    preferredName,
    family,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `HematologicDisease.${field} is required.`,
      );
    }
  }

  const normalizedFamily =
    String(family).trim().toUpperCase();

  if (
    !HEMATOLOGIC_DISEASE_FAMILIES.includes(
      normalizedFamily,
    )
  ) {
    throw new TypeError(
      `Unsupported hematologic disease family: ${normalizedFamily}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      HEMATOLOGIC_DISEASE_SCHEMA_VERSION,
    id: String(id).trim(),
    preferredName:
      String(preferredName).trim(),
    family: normalizedFamily,
    aliases: uniqueStrings(aliases),
    classificationIds:
      uniqueStrings(classificationIds),
    parentDiseaseId:
      parentDiseaseId === null
        ? null
        : String(parentDiseaseId).trim(),
    morphologyFeatureIds:
      uniqueStrings(morphologyFeatureIds),
    diagnosticCriteriaSetIds:
      uniqueStrings(diagnosticCriteriaSetIds),
    confirmatoryTestIds:
      uniqueStrings(confirmatoryTestIds),
    differentialDiseaseIds:
      uniqueStrings(differentialDiseaseIds),
    evidenceSourceIds:
      uniqueStrings(evidenceSourceIds),
    version: String(version).trim(),
    status:
      String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
