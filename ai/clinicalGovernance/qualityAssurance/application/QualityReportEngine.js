import {
  createQualityReport,
} from "../domain/QualityReport.js";

export const QUALITY_REPORT_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityReportEngine {
  build({
    reportId,
    title,
    period,
    score,
    metrics = [],
    findings = [],
    alerts = [],
    recommendations = [],
    generatedAt = new Date(),
  } = {}) {
    const summary =
      findings.length === 0
        ? "Quality indicators are conforming."
        : `${findings.length} quality finding(s) detected.`;

    return createQualityReport({
      reportId,
      title,
      period,
      score,
      summary,
      metricIds:
        metrics.map((metric) => metric.metricId),
      findingIds:
        findings.map((finding) => finding.findingId),
      alertIds:
        alerts.map((alert) => alert.alertId),
      recommendationIds:
        recommendations.map(
          (recommendation) =>
            recommendation.recommendationId,
        ),
      generatedAt:
        generatedAt.toISOString(),
    });
  }
}
