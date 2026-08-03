export const AUDIT_SIGNATURE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditSignature({
  signatureId,
  signerId,
  algorithm,
  value,
  signedAt,
} = {}) {
  for (const [field, candidate] of Object.entries({
    signatureId,
    signerId,
    algorithm,
    value,
    signedAt,
  })) {
    if (!candidate || !String(candidate).trim()) {
      throw new TypeError(
        `AuditSignature.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_SIGNATURE_SCHEMA_VERSION,
    signatureId: String(signatureId).trim(),
    signerId: String(signerId).trim(),
    algorithm: String(algorithm).trim().toUpperCase(),
    value: String(value).trim(),
    signedAt: String(signedAt),
  });
}
