export const CLINICAL_SAFETY_GATE_REASON_SCHEMA_VERSION =
  "CRR-000034-v1";

export const CLINICAL_SAFETY_GATE_REASON_TYPES =
  Object.freeze([
    "VALIDATION",
    "CONFIDENCE",
    "UNCERTAINTY",
    "CONSENSUS",
    "ABSTENTION",
    "DECISION_TREE",
    "ALERT",
    "AUTOMATION",
    "REVIEW",
    "OTHER",
  ]);

export const CLINICAL_SAFETY_GATE_SEVERITIES =
  Object.freeze([
    "INFO",
    "WARNING",
    "ERROR",
    "BLOCKING",
  ]);

export function createClinicalSafetyGateReason({
  id,
  type,
  severity,
  code,
  message,
  blocking = false,
  recommendation = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    type,
    severity,
    code,
    message,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `ClinicalSafetyGateReason.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  const normalizedSeverity =
    String(severity).trim().toUpperCase();

  if (
    !CLINICAL_SAFETY_GATE_REASON_TYPES.includes(
      normalizedType,
    )
  ) {
    throw new TypeError(
      `Unsupported clinical safety gate reason type: ${normalizedType}`,
    );
  }

  if (
    !CLINICAL_SAFETY_GATE_SEVERITIES.includes(
      normalizedSeverity,
    )
  ) {
    throw new TypeError(
      `Unsupported clinical safety gate severity: ${normalizedSeverity}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_SAFETY_GATE_REASON_SCHEMA_VERSION,
    id: String(id).trim(),
    type: normalizedType,
    severity: normalizedSeverity,
    code: String(code).trim().toUpperCase(),
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
