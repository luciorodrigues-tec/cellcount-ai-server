export const CLINICAL_SAFETY_GATE_INPUT_SCHEMA_VERSION =
  "CRR-000034-v1";

function freezeArray(values = []) {
  return Object.freeze([
    ...(Array.isArray(values) ? values : []),
  ]);
}

export function createClinicalSafetyGateInput({
  caseId,
  clinicalValidationResult,
  confidenceCalibrationResult = null,
  uncertaintyResult = null,
  consensusResult = null,
  reasoningResult = null,
  decisionTreeResult = null,
  recommendations = [],
  activeAlerts = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "ClinicalSafetyGateInput.caseId is required.",
    );
  }

  if (
    !clinicalValidationResult ||
    typeof clinicalValidationResult !== "object"
  ) {
    throw new TypeError(
      "ClinicalSafetyGateInput.clinicalValidationResult is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_SAFETY_GATE_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    clinicalValidationResult,
    confidenceCalibrationResult,
    uncertaintyResult,
    consensusResult,
    reasoningResult,
    decisionTreeResult,
    recommendations: freezeArray(recommendations),
    activeAlerts: freezeArray(activeAlerts),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
