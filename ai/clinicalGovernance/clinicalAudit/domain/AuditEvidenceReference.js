export const AUDIT_EVIDENCE_REFERENCE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export const AUDIT_EVIDENCE_TYPES = Object.freeze([
  "IMAGE",
  "MORPHOLOGY",
  "COUNT",
  "CLINICAL",
  "LABORATORY",
  "RULE",
  "MODEL_OUTPUT",
  "OTHER",
]);

export function createAuditEvidenceReference({
  evidenceId,
  type,
  source,
  hash = null,
  summary = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    evidenceId,
    type,
    source,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `AuditEvidenceReference.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!AUDIT_EVIDENCE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported audit evidence type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_EVIDENCE_REFERENCE_SCHEMA_VERSION,
    evidenceId: String(evidenceId).trim(),
    type: normalizedType,
    source: String(source).trim(),
    hash: hash === null ? null : String(hash).trim(),
    summary:
      summary === null ? null : String(summary).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
