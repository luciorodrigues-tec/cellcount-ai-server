export const CLINICAL_RULE_TRACE_SCHEMA_VERSION =
  "CRR-000002-v1";

function freezeArray(values = []) {
  return Object.freeze(
    (Array.isArray(values) ? values : []).map((value) =>
      value && typeof value === "object"
        ? Object.freeze({ ...value })
        : value,
    ),
  );
}

export function createClinicalRuleTrace({
  traceId,
  executionId,
  sequence,
  ruleId,
  ruleVersion,
  category,
  severity,
  matched,
  applied,
  startedAt,
  completedAt,
  durationMs,
  field = null,
  before = null,
  after = null,
  reason = null,
  error = null,
  explanation,
  references = [],
  evidenceLevel = "UNSPECIFIED",
  metadata = {},
} = {}) {
  if (!traceId || !executionId) {
    throw new TypeError(
      "ClinicalRuleTrace requires traceId and executionId.",
    );
  }

  if (!ruleId || !ruleVersion) {
    throw new TypeError(
      "ClinicalRuleTrace requires ruleId and ruleVersion.",
    );
  }

  if (!explanation || typeof explanation !== "object") {
    throw new TypeError(
      "ClinicalRuleTrace requires an explanation object.",
    );
  }

  return Object.freeze({
    schemaVersion: CLINICAL_RULE_TRACE_SCHEMA_VERSION,
    traceId: String(traceId),
    executionId: String(executionId),
    sequence: Number(sequence),
    ruleId: String(ruleId),
    ruleVersion: String(ruleVersion),
    category: String(category || "").toUpperCase(),
    severity: String(severity || "info").toLowerCase(),
    matched: Boolean(matched),
    applied: Boolean(applied),
    startedAt: String(startedAt),
    completedAt: String(completedAt),
    durationMs: Number(durationMs || 0),
    field: field === null ? null : String(field),
    before,
    after,
    reason: reason === null ? null : String(reason),
    error: error === null ? null : String(error),
    evidenceLevel: String(evidenceLevel).toUpperCase(),
    references: freezeArray(references),
    explanation: Object.freeze({ ...explanation }),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
