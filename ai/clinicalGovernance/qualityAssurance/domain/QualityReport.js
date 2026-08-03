export const QUALITY_REPORT_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityReport({
  reportId,
  title,
  period,
  score,
  summary,
  metricIds = [],
  findingIds = [],
  alertIds = [],
  recommendationIds = [],
  generatedAt,
} = {}) {
  if (
    !reportId ||
    !title ||
    !period ||
    !score ||
    !summary ||
    !generatedAt
  ) {
    throw new TypeError(
      "QualityReport requires reportId, title, period, score, summary and generatedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_REPORT_SCHEMA_VERSION,
    reportId: String(reportId),
    title: String(title),
    period,
    score,
    summary: String(summary),
    metricIds:
      Object.freeze([...metricIds]),
    findingIds:
      Object.freeze([...findingIds]),
    alertIds:
      Object.freeze([...alertIds]),
    recommendationIds:
      Object.freeze([...recommendationIds]),
    generatedAt:
      new Date(generatedAt).toISOString(),
  });
}
