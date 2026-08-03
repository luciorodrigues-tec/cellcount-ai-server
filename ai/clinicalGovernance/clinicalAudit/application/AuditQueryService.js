export const AUDIT_QUERY_SERVICE_VERSION =
  "CGL-000001-S2-v1.0.0";

export class AuditQueryService {
  findEventsByType(record, type) {
    const normalized =
      String(type).trim().toUpperCase();

    return Object.freeze(
      (record?.events || []).filter(
        (event) =>
          event.type === normalized,
      ),
    );
  }

  findStepsByStatus(record, status) {
    const normalized =
      String(status).trim().toUpperCase();

    return Object.freeze(
      (record?.steps || []).filter(
        (step) =>
          step.status === normalized,
      ),
    );
  }

  getDecisionHistory(record) {
    return Object.freeze([
      ...(record?.decisionReferences || []),
    ]);
  }
}
