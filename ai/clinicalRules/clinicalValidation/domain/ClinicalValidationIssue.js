export const CLINICAL_VALIDATION_ISSUE_SCHEMA_VERSION =
  "CRR-000033-v1";

export const CLINICAL_VALIDATION_ISSUE_SEVERITIES =
  Object.freeze([
    "INFO",
    "WARNING",
    "ERROR",
    "BLOCKING",
  ]);

export function createClinicalValidationIssue({
  id,
  code,
  severity,
  source,
  message,
  blocking = false,
  recommendation = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    code,
    severity,
    source,
    message,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `ClinicalValidationIssue.${field} is required.`,
      );
    }
  }

  const normalizedSeverity =
    String(severity).trim().toUpperCase();

  if (
    !CLINICAL_VALIDATION_ISSUE_SEVERITIES.includes(
      normalizedSeverity,
    )
  ) {
    throw new TypeError(
      `Unsupported clinical validation severity: ${normalizedSeverity}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_VALIDATION_ISSUE_SCHEMA_VERSION,
    id: String(id).trim(),
    code: String(code).trim().toUpperCase(),
    severity: normalizedSeverity,
    source: String(source).trim().toUpperCase(),
    message: String(message).trim(),
    blocking:
      Boolean(blocking) ||
      normalizedSeverity === "BLOCKING",
    recommendation:
      recommendation === null
        ? null
        : String(recommendation).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
