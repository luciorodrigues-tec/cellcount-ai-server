import {
  createQualityEvaluation,
} from "../domain/QualityEvaluation.js";

export const QUALITY_EVALUATION_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityEvaluationEngine {
  constructor({
    thresholdEngine,
    scoreCalculator,
    findingEngine,
    alertEngine,
    recommendationEngine,
    clock = () => new Date(),
  } = {}) {
    this.thresholdEngine =
      thresholdEngine;
    this.scoreCalculator =
      scoreCalculator;
    this.findingEngine =
      findingEngine;
    this.alertEngine =
      alertEngine;
    this.recommendationEngine =
      recommendationEngine;
    this.clock = clock;
  }

  evaluate({
    evaluationId,
    metrics = [],
  } = {}) {
    const now = this.clock();

    const violations =
      metrics
        .map((metric) =>
          this.thresholdEngine.evaluate(
            metric,
            { occurredAt: now },
          ),
        )
        .filter((result) => result.violated)
        .map((result) => result.violation);

    const findings =
      this.findingEngine.build(
        violations,
        { detectedAt: now },
      );

    const alerts =
      this.alertEngine.build(
        findings,
        { createdAt: now },
      );

    const recommendations =
      this.recommendationEngine.build(
        findings,
      );

    const score =
      this.scoreCalculator.calculate({
        metrics,
        violations,
        alerts,
      });

    const status =
      alerts.some(
        (alert) =>
          alert.severity === "CRITICAL",
      )
        ? "CRITICAL"
        : violations.length > 0
          ? "NON_CONFORMING"
          : "CONFORMING";

    const evaluation =
      createQualityEvaluation({
        evaluationId,
        score,
        status,
        metricIds:
          metrics.map((metric) => metric.metricId),
        findingIds:
          findings.map((finding) => finding.findingId),
        violationIds:
          violations.map(
            (violation) => violation.violationId,
          ),
        evaluatedAt:
          now.toISOString(),
      });

    return Object.freeze({
      evaluation,
      score,
      violations:
        Object.freeze(violations),
      findings,
      alerts,
      recommendations,
    });
  }
}
