export const CLINICAL_CASE_SYNTHESIS_RESULT_SCHEMA_VERSION =
  "CRR-000023-v1";

export function createClinicalCaseSynthesisResult({
  caseId,
  status,
  leadingHypothesis = null,
  selectedClassification = null,
  criteriaSummary = null,
  evidenceSummary = null,
  recommendationSummary = null,
  morphologySummary = null,
  conflicts = [],
  alerts = [],
  requiresHumanReview = false,
  automationBlocked = false,
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !createdAt) {
    throw new TypeError(
      "ClinicalCaseSynthesisResult requires caseId and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_CASE_SYNTHESIS_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    status: String(status || "INDETERMINATE"),
    leadingHypothesis,
    selectedClassification,
    criteriaSummary,
    evidenceSummary,
    recommendationSummary,
    morphologySummary,
    conflicts: Object.freeze([
      ...(Array.isArray(conflicts) ? conflicts : []),
    ]),
    alerts: Object.freeze([
      ...(Array.isArray(alerts) ? alerts : []),
    ]),
    requiresHumanReview: Boolean(requiresHumanReview),
    automationBlocked: Boolean(automationBlocked),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "Clinical case synthesis is decision support and not a definitive diagnosis.",
  });
}
