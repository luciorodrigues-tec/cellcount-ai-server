export const DASHBOARD_SCOPE_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export const DASHBOARD_SCOPE_TYPES = Object.freeze([
  "GLOBAL",
  "ORGANIZATION",
  "LABORATORY",
  "DEPARTMENT",
  "WORKFLOW",
  "ENGINE",
]);

export function createDashboardScope({
  type,
  targetId = null,
  metadata = {},
} = {}) {
  const normalized =
    String(type || "").trim().toUpperCase();

  if (!DASHBOARD_SCOPE_TYPES.includes(normalized)) {
    throw new TypeError(
      `Unsupported dashboard scope type: ${normalized}`,
    );
  }

  if (
    normalized !== "GLOBAL" &&
    (!targetId || !String(targetId).trim())
  ) {
    throw new TypeError(
      "DashboardScope.targetId is required for non-global scopes.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_SCOPE_SCHEMA_VERSION,
    type: normalized,
    targetId:
      normalized === "GLOBAL"
        ? null
        : String(targetId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
