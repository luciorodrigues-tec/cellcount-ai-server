export const DIAGNOSTIC_CLASSIFICATION_CANDIDATE_SCHEMA_VERSION =
  "CRR-000020-v1";

export const DIAGNOSTIC_CLASSIFICATION_CANDIDATE_STATUSES =
  Object.freeze([
    "ELIGIBLE",
    "INELIGIBLE",
    "EXCLUDED",
    "INDETERMINATE",
  ]);

export function createDiagnosticClassificationCandidate({
  id,
  classificationId,
  diseaseEntityId,
  criteriaSetId,
  label,
  precedence = 0,
  exclusionCandidateIds = [],
  competingCandidateIds = [],
  requiredStatus = "MET",
  version = "1.0.0",
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    classificationId,
    diseaseEntityId,
    criteriaSetId,
    label,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticClassificationCandidate.${field} is required.`,
      );
    }
  }

  const numericPrecedence = Number(precedence);
  if (!Number.isFinite(numericPrecedence)) {
    throw new TypeError(
      "DiagnosticClassificationCandidate.precedence must be finite.",
    );
  }

  const freezeIds = (values = []) =>
    Object.freeze([
      ...new Set(
        (Array.isArray(values) ? values : [])
          .map(String)
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ]);

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_CLASSIFICATION_CANDIDATE_SCHEMA_VERSION,
    id: String(id).trim(),
    classificationId: String(classificationId).trim(),
    diseaseEntityId: String(diseaseEntityId).trim(),
    criteriaSetId: String(criteriaSetId).trim(),
    label: String(label).trim(),
    precedence: numericPrecedence,
    exclusionCandidateIds:
      freezeIds(exclusionCandidateIds),
    competingCandidateIds:
      freezeIds(competingCandidateIds),
    requiredStatus:
      String(requiredStatus).trim().toUpperCase(),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
