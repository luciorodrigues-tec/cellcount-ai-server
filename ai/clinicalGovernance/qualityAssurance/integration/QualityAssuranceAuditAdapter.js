export const QUALITY_ASSURANCE_AUDIT_ADAPTER_VERSION =
  "CGL-000005-S3-v1.0.0";

export class QualityAssuranceAuditAdapter {
  toAuditPayload(record) {
    if (!record) {
      throw new TypeError(
        "QualityAssuranceAuditAdapter.record is required.",
      );
    }

    const evaluation =
      record.evaluations[0] || null;

    return Object.freeze({
      qualityAssuranceId:
        record.qualityAssuranceId.toString(),
      caseId:
        record.caseId,
      score:
        evaluation?.score?.value ?? null,
      status:
        evaluation?.status ?? null,
      findingIds:
        Object.freeze(
          record.findings.map(
            (finding) => finding.findingId,
          ),
        ),
      violationIds:
        Object.freeze(
          record.violations.map(
            (violation) =>
              violation.violationId,
          ),
        ),
      alertIds:
        Object.freeze(
          record.alerts.map(
            (alert) => alert.alertId,
          ),
        ),
      requiresHumanReview:
        record.recommendations.some(
          (recommendation) =>
            recommendation.requiresHumanReview,
        ),
      trend:
        record.trend?.direction ?? null,
    });
  }
}
