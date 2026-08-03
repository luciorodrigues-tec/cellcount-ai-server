export const CLINICAL_VALIDATION_INPUT_SCHEMA_VERSION =
  "CRR-000033-v1";

function freezeArray(values = []) {
  return Object.freeze([
    ...(Array.isArray(values) ? values : []),
  ]);
}

export function createClinicalValidationInput({
  caseId,
  classificationResult = null,
  evidenceScores = [],
  reasoningResult = null,
  consensusResult = null,
  confidenceCalibrationResult = null,
  uncertaintyResult = null,
  decisionTreeResult = null,
  recommendations = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "ClinicalValidationInput.caseId is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_VALIDATION_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    classificationResult,
    evidenceScores: freezeArray(evidenceScores),
    reasoningResult,
    consensusResult,
    confidenceCalibrationResult,
    uncertaintyResult,
    decisionTreeResult,
    recommendations: freezeArray(recommendations),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
