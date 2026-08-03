import {
  assertQualitySeverity,
} from "./QualitySeverity.js";

export const QUALITY_ALERT_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityAlert({
  alertId,
  code,
  message,
  severity,
  active = true,
  createdAt,
  acknowledgedAt = null,
} = {}) {
  if (!alertId || !code || !message || !createdAt) {
    throw new TypeError(
      "QualityAlert requires alertId, code, message and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_ALERT_SCHEMA_VERSION,
    alertId: String(alertId),
    code: String(code),
    message: String(message),
    severity:
      assertQualitySeverity(severity),
    active: Boolean(active),
    createdAt:
      new Date(createdAt).toISOString(),
    acknowledgedAt:
      acknowledgedAt === null
        ? null
        : new Date(acknowledgedAt).toISOString(),
  });
}
