export const POLICY_OVERRIDE_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export function createPolicyOverride({
  overrideId,
  targetRuleId,
  reason,
  approvedBy,
  validUntil = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    overrideId,
    targetRuleId,
    reason,
    approvedBy,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `PolicyOverride.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      POLICY_OVERRIDE_SCHEMA_VERSION,
    overrideId: String(overrideId).trim(),
    targetRuleId: String(targetRuleId).trim(),
    reason: String(reason).trim(),
    approvedBy: String(approvedBy).trim(),
    validUntil:
      validUntil === null ? null : String(validUntil),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
