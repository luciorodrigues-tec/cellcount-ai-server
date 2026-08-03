export const AUDIT_ENGINE_REFERENCE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditEngineReference({
  engineId,
  name,
  version,
  policyVersion = null,
  checksum = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    engineId,
    name,
    version,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `AuditEngineReference.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_ENGINE_REFERENCE_SCHEMA_VERSION,
    engineId: String(engineId).trim(),
    name: String(name).trim(),
    version: String(version).trim(),
    policyVersion:
      policyVersion === null
        ? null
        : String(policyVersion).trim(),
    checksum:
      checksum === null ? null : String(checksum).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
