export const QUALITY_ASSURANCE_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export class QualityAssurance {
  constructor({
    qualityAssuranceId,
    caseId = null,
    period,
    metrics = [],
    evaluations = [],
    findings = [],
    violations = [],
    alerts = [],
    recommendations = [],
    benchmarks = [],
    reports = [],
    trend = null,
    createdAt,
    metadata = {},
  } = {}) {
    if (!qualityAssuranceId || !period || !createdAt) {
      throw new TypeError(
        "QualityAssurance requires qualityAssuranceId, period and createdAt.",
      );
    }

    const ensureUnique = (values, selector, label) => {
      const ids = values.map(selector);
      if (new Set(ids).size !== ids.length) {
        throw new Error(
          `QualityAssurance contains duplicate ${label}.`,
        );
      }
    };

    ensureUnique(metrics, (item) => item.metricId, "metric ids");
    ensureUnique(evaluations, (item) => item.evaluationId, "evaluation ids");
    ensureUnique(findings, (item) => item.findingId, "finding ids");
    ensureUnique(violations, (item) => item.violationId, "violation ids");
    ensureUnique(alerts, (item) => item.alertId, "alert ids");
    ensureUnique(recommendations, (item) => item.recommendationId, "recommendation ids");
    ensureUnique(benchmarks, (item) => item.benchmarkId, "benchmark ids");
    ensureUnique(reports, (item) => item.reportId, "report ids");

    this.schemaVersion =
      QUALITY_ASSURANCE_SCHEMA_VERSION;
    this.qualityAssuranceId =
      qualityAssuranceId;
    this.caseId =
      caseId === null ? null : String(caseId);
    this.period = period;
    this.metrics =
      Object.freeze([...metrics]);
    this.evaluations =
      Object.freeze([...evaluations]);
    this.findings =
      Object.freeze([...findings]);
    this.violations =
      Object.freeze([...violations]);
    this.alerts =
      Object.freeze([...alerts]);
    this.recommendations =
      Object.freeze(
        [...recommendations].sort(
          (a, b) => a.priority - b.priority,
        ),
      );
    this.benchmarks =
      Object.freeze([...benchmarks]);
    this.reports =
      Object.freeze([...reports]);
    this.trend = trend;
    this.createdAt =
      new Date(createdAt).toISOString();
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    Object.freeze(this);
  }

  hasCriticalAlert() {
    return this.alerts.some(
      (alert) =>
        alert.active &&
        alert.severity === "CRITICAL",
    );
  }
}
