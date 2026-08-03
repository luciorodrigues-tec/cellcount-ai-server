export const DIAGNOSTIC_UNCERTAINTY_INPUT_SCHEMA_VERSION =
  "CRR-000031-v1";

function freezeArray(values = []) {
  return Object.freeze([
    ...(Array.isArray(values) ? values : []),
  ]);
}

export function createDiagnosticUncertaintyInput({
  caseId,
  confidenceCalibrationResult,
  consensusResult = null,
  reasoningResult = null,
  evidenceScores = [],
  competingHypotheses = [],
  missingData = [],
  imageQualityScore = null,
  multiImageConsistencyScore = null,
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "DiagnosticUncertaintyInput.caseId is required.",
    );
  }

  if (
    !confidenceCalibrationResult ||
    typeof confidenceCalibrationResult !== "object"
  ) {
    throw new TypeError(
      "DiagnosticUncertaintyInput.confidenceCalibrationResult is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_UNCERTAINTY_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    confidenceCalibrationResult,
    consensusResult,
    reasoningResult,
    evidenceScores: freezeArray(evidenceScores),
    competingHypotheses: freezeArray(
      competingHypotheses,
    ),
    missingData: freezeArray(missingData),
    imageQualityScore,
    multiImageConsistencyScore,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
