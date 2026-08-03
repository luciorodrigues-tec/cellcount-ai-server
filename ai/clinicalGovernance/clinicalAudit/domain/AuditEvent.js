export const AUDIT_EVENT_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export const AUDIT_EVENT_TYPES = Object.freeze([
  "CASE_OPENED",
  "ENGINE_STARTED",
  "ENGINE_COMPLETED",
  "EVIDENCE_REGISTERED",
  "DECISION_RECORDED",
  "REVIEW_REQUESTED",
  "REVIEW_COMPLETED",
  "SAFETY_GATE_DECIDED",
  "AUDIT_SEALED",
  "OTHER",
]);

export function createAuditEvent({
  eventId,
  type,
  occurredAt,
  sequence,
  actor,
  payload = {},
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    eventId,
    type,
    occurredAt,
    sequence,
  })) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      throw new TypeError(
        `AuditEvent.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!AUDIT_EVENT_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported audit event type: ${normalizedType}`,
    );
  }

  const numericSequence = Number(sequence);
  if (
    !Number.isInteger(numericSequence) ||
    numericSequence < 1
  ) {
    throw new TypeError(
      "AuditEvent.sequence must be a positive integer.",
    );
  }

  if (!actor || typeof actor !== "object") {
    throw new TypeError(
      "AuditEvent.actor is required.",
    );
  }

  return Object.freeze({
    schemaVersion: AUDIT_EVENT_SCHEMA_VERSION,
    eventId: String(eventId).trim(),
    type: normalizedType,
    occurredAt: String(occurredAt),
    sequence: numericSequence,
    actor,
    payload: Object.freeze({
      ...(payload && typeof payload === "object"
        ? payload
        : {}),
    }),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
