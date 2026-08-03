export const DIAGNOSTIC_CONFIDENCE_INPUT_SCHEMA_VERSION =
  "CRR-000030-v1";

export function createDiagnosticConfidenceInput({
  caseId,
  classificationResult = null,
  evidenceScores = [],
  syndromeResult = null,
  reasoningResult = null,
  consensusResult = null,
  imageQualityScore = null,
  multiImageConsistencyScore = null,
  declaredConfidence = null,
  additionalFactors = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "DiagnosticConfidenceInput.caseId is required.",
    );
  }

  const freezeArray = (value) =>
    Object.freeze([...(Array.isArray(value) ? value : [])]);

  return Object.freeze({
    schemaVersion: DIAGNOSTIC_CONFIDENCE_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    classificationResult,
    evidenceScores: freezeArray(evidenceScores),
    syndromeResult,
    reasoningResult,
    consensusResult,
    imageQualityScore,
    multiImageConsistencyScore,
    declaredConfidence,
    additionalFactors: freezeArray(additionalFactors),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
