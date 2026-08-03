export const DIAGNOSTIC_CRITERION_SCHEMA_VERSION =
  "CRR-000019-v1";

export const DIAGNOSTIC_CRITERION_TYPES =
  Object.freeze([
    "REQUIRED",
    "MAJOR",
    "MINOR",
    "SUPPORTIVE",
    "EXCLUSION",
    "THRESHOLD",
    "COMPOSITE",
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

export function createDiagnosticCriterion({
  id,
  classificationId,
  diseaseEntityId,
  type,
  label,
  featureIds = [],
  operator = "ANY",
  threshold = null,
  unit = null,
  weight = 1,
  requiredCount = 1,
  evidenceSourceIds = [],
  version = "1.0.0",
  status = "DRAFT",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    classificationId,
    diseaseEntityId,
    type,
    label,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticCriterion.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  if (!DIAGNOSTIC_CRITERION_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported diagnostic criterion type: ${normalizedType}`,
    );
  }

  const numericWeight = Number(weight);
  const numericRequiredCount = Number(requiredCount);

  if (!Number.isFinite(numericWeight) || numericWeight < 0) {
    throw new TypeError(
      "DiagnosticCriterion.weight must be non-negative.",
    );
  }

  if (
    !Number.isInteger(numericRequiredCount) ||
    numericRequiredCount < 0
  ) {
    throw new TypeError(
      "DiagnosticCriterion.requiredCount must be a non-negative integer.",
    );
  }

  return Object.freeze({
    schemaVersion: DIAGNOSTIC_CRITERION_SCHEMA_VERSION,
    id: String(id).trim(),
    classificationId: String(classificationId).trim(),
    diseaseEntityId: String(diseaseEntityId).trim(),
    type: normalizedType,
    label: String(label).trim(),
    featureIds: uniqueStrings(featureIds),
    operator: String(operator).trim().toUpperCase(),
    threshold:
      threshold === null ? null : Number(threshold),
    unit: unit === null ? null : String(unit).trim(),
    weight: numericWeight,
    requiredCount: numericRequiredCount,
    evidenceSourceIds: uniqueStrings(evidenceSourceIds),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
