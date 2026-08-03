export const EXPLAINABLE_DECISION_TREE_INPUT_SCHEMA_VERSION =
  "CRR-000032-v1";

export function createExplainableDecisionTreeInput({
  caseId,
  patternResult = null,
  syndromeResult = null,
  criteriaResults = [],
  classificationResult = null,
  evidenceScores = [],
  reasoningResult = null,
  consensusResult = null,
  confidenceCalibrationResult = null,
  uncertaintyResult = null,
  recommendations = [],
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "ExplainableDecisionTreeInput.caseId is required.",
    );
  }

  const freezeArray = (values = []) =>
    Object.freeze([...(Array.isArray(values) ? values : [])]);

  return Object.freeze({
    schemaVersion:
      EXPLAINABLE_DECISION_TREE_INPUT_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    patternResult,
    syndromeResult,
    criteriaResults: freezeArray(criteriaResults),
    classificationResult,
    evidenceScores: freezeArray(evidenceScores),
    reasoningResult,
    consensusResult,
    confidenceCalibrationResult,
    uncertaintyResult,
    recommendations: freezeArray(recommendations),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
