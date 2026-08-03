export const POLICY_DECISION_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export function createPolicyDecision({
  policyId,
  decision,
  matchedRuleIds = [],
  reason = null,
  requiresHumanReview = false,
  metadata = {},
} = {}) {
  if (!policyId || !decision) {
    throw new TypeError(
      "PolicyDecision requires policyId and decision.",
    );
  }

  return Object.freeze({
    schemaVersion:
      POLICY_DECISION_SCHEMA_VERSION,
    policyId: String(policyId),
    decision: String(decision).trim().toUpperCase(),
    matchedRuleIds: Object.freeze([...matchedRuleIds]),
    reason:
      reason === null ? null : String(reason).trim(),
    requiresHumanReview:
      Boolean(requiresHumanReview),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
