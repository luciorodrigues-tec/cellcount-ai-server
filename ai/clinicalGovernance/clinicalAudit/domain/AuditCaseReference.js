export const AUDIT_CASE_REFERENCE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditCaseReference({
  caseId,
  pseudonymizedPatientId = null,
  protocol = null,
  specimenType = null,
  metadata = {},
} = {}) {
  if (!caseId || !String(caseId).trim()) {
    throw new TypeError(
      "AuditCaseReference.caseId is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_CASE_REFERENCE_SCHEMA_VERSION,
    caseId: String(caseId).trim(),
    pseudonymizedPatientId:
      pseudonymizedPatientId === null
        ? null
        : String(pseudonymizedPatientId).trim(),
    protocol:
      protocol === null ? null : String(protocol).trim(),
    specimenType:
      specimenType === null
        ? null
        : String(specimenType).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
