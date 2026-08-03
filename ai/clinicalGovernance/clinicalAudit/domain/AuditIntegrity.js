export const AUDIT_INTEGRITY_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditIntegrity({
  algorithm = "SHA-256",
  hash,
  previousHash = null,
  verified = false,
  verifiedAt = null,
} = {}) {
  if (!hash || !String(hash).trim()) {
    throw new TypeError(
      "AuditIntegrity.hash is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_INTEGRITY_SCHEMA_VERSION,
    algorithm: String(algorithm).trim().toUpperCase(),
    hash: String(hash).trim(),
    previousHash:
      previousHash === null
        ? null
        : String(previousHash).trim(),
    verified: Boolean(verified),
    verifiedAt:
      verifiedAt === null ? null : String(verifiedAt),
  });
}
