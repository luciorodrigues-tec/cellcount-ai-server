export const AUDIT_STATUS_VERSION =
  "CGL-000001-S1-v1.0.0";

export const AUDIT_STATUSES = Object.freeze([
  "OPEN",
  "SEALED",
  "ARCHIVED",
  "INVALIDATED",
]);

export function assertAuditStatus(value) {
  const normalized =
    String(value || "").trim().toUpperCase();

  if (!AUDIT_STATUSES.includes(normalized)) {
    throw new TypeError(
      `Unsupported audit status: ${normalized}`,
    );
  }

  return normalized;
}
