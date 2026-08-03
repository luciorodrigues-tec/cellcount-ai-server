export const AUDIT_STEP_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export const AUDIT_STEP_STATUSES = Object.freeze([
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "SKIPPED",
]);

export function createAuditStep({
  stepId,
  name,
  order,
  status,
  engineReference = null,
  startedAt = null,
  completedAt = null,
  inputRefs = [],
  outputRefs = [],
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    stepId,
    name,
    order,
    status,
  })) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      throw new TypeError(
        `AuditStep.${field} is required.`,
      );
    }
  }

  const numericOrder = Number(order);
  if (!Number.isInteger(numericOrder) || numericOrder < 1) {
    throw new TypeError(
      "AuditStep.order must be a positive integer.",
    );
  }

  const normalizedStatus =
    String(status).trim().toUpperCase();

  if (!AUDIT_STEP_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported audit step status: ${normalizedStatus}`,
    );
  }

  return Object.freeze({
    schemaVersion: AUDIT_STEP_SCHEMA_VERSION,
    stepId: String(stepId).trim(),
    name: String(name).trim(),
    order: numericOrder,
    status: normalizedStatus,
    engineReference,
    startedAt:
      startedAt === null ? null : String(startedAt),
    completedAt:
      completedAt === null ? null : String(completedAt),
    inputRefs: Object.freeze([...inputRefs]),
    outputRefs: Object.freeze([...outputRefs]),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
