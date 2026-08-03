export const DASHBOARD_ALERT_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export const DASHBOARD_ALERT_SEVERITIES =
  Object.freeze([
    "INFO",
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL",
  ]);

export function createDashboardAlert({
  alertId,
  code,
  message,
  severity,
  sourceModule,
  active = true,
  createdAt,
  metadata = {},
} = {}) {
  if (
    !alertId ||
    !code ||
    !message ||
    !sourceModule ||
    !createdAt
  ) {
    throw new TypeError(
      "DashboardAlert requires alertId, code, message, sourceModule and createdAt.",
    );
  }

  const normalized =
    String(severity || "").trim().toUpperCase();

  if (
    !DASHBOARD_ALERT_SEVERITIES.includes(
      normalized,
    )
  ) {
    throw new TypeError(
      `Unsupported dashboard alert severity: ${normalized}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_ALERT_SCHEMA_VERSION,
    alertId: String(alertId),
    code: String(code),
    message: String(message),
    severity: normalized,
    sourceModule: String(sourceModule),
    active: Boolean(active),
    createdAt:
      new Date(createdAt).toISOString(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
