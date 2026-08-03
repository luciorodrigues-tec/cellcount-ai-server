export const CLINICAL_DECISION_RESULT_SCHEMA_VERSION =
  "CRR-000012-v1";

export function createClinicalDecisionResult({
  requestId,
  executionId,
  status,
  orchestration,
  structuredOutput,
  warnings = [],
  errors = [],
  startedAt,
  completedAt,
  durationMs,
} = {}) {
  if (!requestId || !executionId) {
    throw new TypeError(
      "ClinicalDecisionResult requires requestId and executionId.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_DECISION_RESULT_SCHEMA_VERSION,
    requestId: String(requestId),
    executionId: String(executionId),
    status: String(status || "COMPLETED"),
    orchestration,
    structuredOutput:
      structuredOutput &&
      typeof structuredOutput === "object"
        ? Object.freeze({ ...structuredOutput })
        : structuredOutput,
    warnings: Object.freeze([
      ...(Array.isArray(warnings) ? warnings : []),
    ]),
    errors: Object.freeze([
      ...(Array.isArray(errors) ? errors : []),
    ]),
    startedAt: String(startedAt),
    completedAt: String(completedAt),
    durationMs: Number(durationMs || 0),
    requiresHumanReview:
      orchestration?.requiresHumanReview === true ||
      errors.length > 0,
    safetyStatement:
      "This result is clinical decision support and not a definitive diagnosis.",
  });
}
