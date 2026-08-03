export const POLICY_SCOPE_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export const POLICY_SCOPE_TYPES = Object.freeze([
  "GLOBAL",
  "ORGANIZATION",
  "LABORATORY",
  "DEPARTMENT",
  "WORKFLOW",
  "ENGINE",
]);

export function createPolicyScope({
  type,
  targetId = null,
  metadata = {},
} = {}) {
  const normalizedType =
    String(type || "").trim().toUpperCase();

  if (!POLICY_SCOPE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported policy scope type: ${normalizedType}`,
    );
  }

  if (
    normalizedType !== "GLOBAL" &&
    (!targetId || !String(targetId).trim())
  ) {
    throw new TypeError(
      "PolicyScope.targetId is required for non-global scopes.",
    );
  }

  return Object.freeze({
    schemaVersion: POLICY_SCOPE_SCHEMA_VERSION,
    type: normalizedType,
    targetId:
      normalizedType === "GLOBAL"
        ? null
        : String(targetId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
