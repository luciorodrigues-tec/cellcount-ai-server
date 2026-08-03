export const HEMATOLOGIC_DIAGNOSTIC_REASONING_INPUT_SCHEMA_VERSION =
  "CRR-000028-v1";

function freezeArray(values = []) {
  return Object.freeze([
    ...(Array.isArray(values) ? values : []),
  ]);
}

export function createHematologicDiagnosticReasoningInput({
  caseId,
  patternResult = null,
  syndromeResult = null,
  diseaseCandidates = [],
  criteriaResults = [],
  evidenceScores = [],
  classificationResult = null,
  alerts = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "HematologicDiagnosticReasoningInput.caseId is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      HEMATOLOGIC_DIAGNOSTIC_REASONING_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    patternResult,
    syndromeResult,
    diseaseCandidates: freezeArray(diseaseCandidates),
    criteriaResults: freezeArray(criteriaResults),
    evidenceScores: freezeArray(evidenceScores),
    classificationResult,
    alerts: freezeArray(alerts),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
