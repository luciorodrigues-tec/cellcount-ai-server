export const AUDIT_ACTOR_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export const AUDIT_ACTOR_TYPES = Object.freeze([
  "SYSTEM",
  "USER",
  "REVIEWER",
  "SERVICE",
]);

export function createAuditActor({
  id,
  type,
  displayName = null,
  organizationId = null,
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("AuditActor.id is required.");
  }

  const normalizedType =
    String(type || "").trim().toUpperCase();

  if (!AUDIT_ACTOR_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported audit actor type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion: AUDIT_ACTOR_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    displayName:
      displayName === null ? null : String(displayName).trim(),
    organizationId:
      organizationId === null
        ? null
        : String(organizationId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
