export const POLICY_RULE_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export const POLICY_RULE_EFFECTS = Object.freeze([
  "ALLOW",
  "DENY",
  "REQUIRE_REVIEW",
  "OVERRIDE",
  "WARN",
]);

export function createPolicyRule({
  ruleId,
  condition,
  effect,
  priority = 100,
  message = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    ruleId,
    condition,
    effect,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `PolicyRule.${field} is required.`,
      );
    }
  }

  const normalizedEffect =
    String(effect).trim().toUpperCase();

  if (!POLICY_RULE_EFFECTS.includes(normalizedEffect)) {
    throw new TypeError(
      `Unsupported policy rule effect: ${normalizedEffect}`,
    );
  }

  const numericPriority = Number(priority);
  if (
    !Number.isInteger(numericPriority) ||
    numericPriority < 1
  ) {
    throw new TypeError(
      "PolicyRule.priority must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion: POLICY_RULE_SCHEMA_VERSION,
    ruleId: String(ruleId).trim(),
    condition: String(condition).trim(),
    effect: normalizedEffect,
    priority: numericPriority,
    message:
      message === null ? null : String(message).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
