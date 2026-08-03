export const AUDIT_VALIDATION_SERVICE_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditValidationService {
  validate(record) {
    const issues = [];

    if (!record?.auditId) {
      issues.push("AUDIT_ID_MISSING");
    }

    if (!record?.caseReference?.caseId) {
      issues.push("CASE_REFERENCE_MISSING");
    }

    if (!record?.actor) {
      issues.push("ACTOR_MISSING");
    }

    const eventSequences =
      (record?.events || []).map(
        (event) => event.sequence,
      );

    if (
      new Set(eventSequences).size !==
      eventSequences.length
    ) {
      issues.push(
        "DUPLICATE_EVENT_SEQUENCE",
      );
    }

    const stepOrders =
      (record?.steps || []).map(
        (step) => step.order,
      );

    if (
      new Set(stepOrders).size !==
      stepOrders.length
    ) {
      issues.push(
        "DUPLICATE_STEP_ORDER",
      );
    }

    if (
      record?.status === "SEALED" &&
      !record?.integrity
    ) {
      issues.push(
        "SEALED_WITHOUT_INTEGRITY",
      );
    }

    return Object.freeze({
      valid: issues.length === 0,
      issues: Object.freeze(issues),
    });
  }
}
