export const EVIDENCE_INTEGRITY_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createEvidenceIntegrity({
  algorithm = "SHA-256",
  hash,
  verified = false,
  verifiedAt = null,
} = {}) {
  if (!hash || !String(hash).trim()) {
    throw new TypeError(
      "EvidenceIntegrity.hash is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      EVIDENCE_INTEGRITY_SCHEMA_VERSION,
    algorithm:
      String(algorithm).trim().toUpperCase(),
    hash: String(hash).trim(),
    verified: Boolean(verified),
    verifiedAt:
      verifiedAt === null ? null : String(verifiedAt),
  });
}
