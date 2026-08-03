export const AUDIT_DECISION_REFERENCE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditDecisionReference({
  decisionId,
  decisionType,
  outcome,
  selectedHypothesisId = null,
  confidence = null,
  uncertainty = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    decisionId,
    decisionType,
    outcome,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `AuditDecisionReference.${field} is required.`,
      );
    }
  }

  const normalizeOptionalScore = (value, field) => {
    if (value === null || value === undefined) return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
      throw new TypeError(
        `AuditDecisionReference.${field} must be between 0 and 1.`,
      );
    }
    return numeric;
  };

  return Object.freeze({
    schemaVersion:
      AUDIT_DECISION_REFERENCE_SCHEMA_VERSION,
    decisionId: String(decisionId).trim(),
    decisionType: String(decisionType).trim().toUpperCase(),
    outcome: String(outcome).trim().toUpperCase(),
    selectedHypothesisId:
      selectedHypothesisId === null
        ? null
        : String(selectedHypothesisId).trim(),
    confidence:
      normalizeOptionalScore(confidence, "confidence"),
    uncertainty:
      normalizeOptionalScore(uncertainty, "uncertainty"),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
