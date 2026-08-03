import {
  createDashboardMetric,
} from "../domain/DashboardMetric.js";

export const DASHBOARD_METRIC_AGGREGATOR_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardMetricAggregator {
  aggregate({
    auditRecords = [],
    provenanceRecords = [],
    policyResults = [],
    guidelineResults = [],
    qualityRecords = [],
    safetyResults = [],
    operationalMetrics = {},
  } = {}) {
    const metrics = [];

    const push = (metric) => metrics.push(
      createDashboardMetric(metric),
    );

    push({
      metricId: "CGD-AUDIT-COUNT",
      name: "Audit records",
      category: "AUDIT",
      value: auditRecords.length,
      unit: "records",
      sourceModule: "CGL-000001",
    });

    push({
      metricId: "CGD-PROVENANCE-COUNT",
      name: "Provenance records",
      category: "PROVENANCE",
      value: provenanceRecords.length,
      unit: "records",
      sourceModule: "CGL-000002",
    });

    push({
      metricId: "CGD-POLICY-DECISIONS",
      name: "Policy decisions",
      category: "POLICY",
      value: policyResults.length,
      unit: "decisions",
      sourceModule: "CGL-000003",
    });

    push({
      metricId: "CGD-GUIDELINE-EXECUTIONS",
      name: "Guideline executions",
      category: "GUIDELINE",
      value: guidelineResults.length,
      unit: "executions",
      sourceModule: "CGL-000004",
    });

    const qualityScores = qualityRecords
      .map((record) => record.evaluations?.[0]?.score?.value)
      .filter((value) => Number.isFinite(Number(value)));

    push({
      metricId: "CGD-QUALITY-MEAN",
      name: "Mean quality score",
      category: "QUALITY",
      value:
        qualityScores.length === 0
          ? 0
          : qualityScores.reduce((a, b) => a + Number(b), 0) /
            qualityScores.length,
      unit: "score",
      sourceModule: "CGL-000005",
    });

    const safetyReleased = safetyResults.filter(
      (result) => result?.releaseAllowed === true,
    ).length;

    push({
      metricId: "CGD-SAFETY-RELEASE-RATE",
      name: "Safety release rate",
      category: "SAFETY",
      value:
        safetyResults.length === 0
          ? 0
          : safetyReleased / safetyResults.length,
      unit: "ratio",
      sourceModule: "CRR-000034",
    });

    for (const [key, value] of Object.entries(operationalMetrics)) {
      if (!Number.isFinite(Number(value))) continue;

      push({
        metricId: `CGD-OP-${String(key).toUpperCase()}`,
        name: String(key),
        category: "OPERATIONAL",
        value: Number(value),
        sourceModule: "RUNTIME",
      });
    }

    return Object.freeze(metrics);
  }
}
