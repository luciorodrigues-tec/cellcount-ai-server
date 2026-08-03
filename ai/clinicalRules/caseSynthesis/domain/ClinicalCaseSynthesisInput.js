export const CLINICAL_CASE_SYNTHESIS_INPUT_SCHEMA_VERSION =
  "CRR-000023-v1";

export function createClinicalCaseSynthesisInput({
  caseId,
  hypothesisRanking = null,
  classificationResult = null,
  criteriaResults = [],
  evidenceScores = [],
  recommendations = [],
  morphology = null,
  alerts = [],
  conflicts = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "ClinicalCaseSynthesisInput.caseId is required.",
    );
  }

  const freezeArray = (values = []) =>
    Object.freeze([
      ...(Array.isArray(values) ? values : []),
    ]);

  return Object.freeze({
    schemaVersion:
      CLINICAL_CASE_SYNTHESIS_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    hypothesisRanking,
    classificationResult,
    criteriaResults: freezeArray(criteriaResults),
    evidenceScores: freezeArray(evidenceScores),
    recommendations: freezeArray(recommendations),
    morphology,
    alerts: freezeArray(alerts),
    conflicts: freezeArray(conflicts),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
