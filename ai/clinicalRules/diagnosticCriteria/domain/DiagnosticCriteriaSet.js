export const DIAGNOSTIC_CRITERIA_SET_SCHEMA_VERSION =
  "CRR-000019-v1";

export function createDiagnosticCriteriaSet({
  id,
  classificationId,
  diseaseEntityId,
  title,
  criterionIds = [],
  minimumMajor = 0,
  minimumMinor = 0,
  minimumSupportive = 0,
  minimumScore = 0,
  exclusionOverrides = true,
  version = "1.0.0",
  status = "DRAFT",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    classificationId,
    diseaseEntityId,
    title,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticCriteriaSet.${field} is required.`,
      );
    }
  }

  const counts = {
    minimumMajor: Number(minimumMajor),
    minimumMinor: Number(minimumMinor),
    minimumSupportive: Number(minimumSupportive),
  };

  for (const [field, value] of Object.entries(counts)) {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError(
        `DiagnosticCriteriaSet.${field} must be a non-negative integer.`,
      );
    }
  }

  const numericMinimumScore = Number(minimumScore);
  if (!Number.isFinite(numericMinimumScore) || numericMinimumScore < 0) {
    throw new TypeError(
      "DiagnosticCriteriaSet.minimumScore must be non-negative.",
    );
  }

  return Object.freeze({
    schemaVersion: DIAGNOSTIC_CRITERIA_SET_SCHEMA_VERSION,
    id: String(id).trim(),
    classificationId: String(classificationId).trim(),
    diseaseEntityId: String(diseaseEntityId).trim(),
    title: String(title).trim(),
    criterionIds: Object.freeze([
      ...new Set(
        (Array.isArray(criterionIds) ? criterionIds : [])
          .map(String)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ]),
    minimumMajor: counts.minimumMajor,
    minimumMinor: counts.minimumMinor,
    minimumSupportive: counts.minimumSupportive,
    minimumScore: numericMinimumScore,
    exclusionOverrides: Boolean(exclusionOverrides),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
