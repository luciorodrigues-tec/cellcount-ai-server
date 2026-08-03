import {
  QualityAssurance,
} from "../domain/QualityAssurance.js";

import {
  QualityAssuranceId,
} from "../domain/QualityAssuranceId.js";

export const QUALITY_ASSURANCE_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityAssuranceEngine {
  constructor({
    evaluationEngine,
    trendEngine,
    reportEngine,
    clock = () => new Date(),
  } = {}) {
    this.evaluationEngine =
      evaluationEngine;
    this.trendEngine =
      trendEngine;
    this.reportEngine =
      reportEngine;
    this.clock = clock;
  }

  evaluate({
    qualityAssuranceId,
    caseId = null,
    period,
    metrics = [],
    benchmarks = [],
    historicalScores = [],
    metadata = {},
  } = {}) {
    const now = this.clock();

    const evaluationResult =
      this.evaluationEngine.evaluate({
        evaluationId:
          `${qualityAssuranceId}-EVAL-1`,
        metrics,
      });

    const trend =
      this.trendEngine.calculate([
        ...historicalScores,
        evaluationResult.score,
      ]);

    const report =
      this.reportEngine.build({
        reportId:
          `${qualityAssuranceId}-REPORT-1`,
        title:
          "Quality Assurance Report",
        period,
        score:
          evaluationResult.score,
        metrics,
        findings:
          evaluationResult.findings,
        alerts:
          evaluationResult.alerts,
        recommendations:
          evaluationResult.recommendations,
        generatedAt: now,
      });

    return new QualityAssurance({
      qualityAssuranceId:
        qualityAssuranceId instanceof
          QualityAssuranceId
          ? qualityAssuranceId
          : new QualityAssuranceId(
              qualityAssuranceId,
            ),
      caseId,
      period,
      metrics,
      evaluations:
        [evaluationResult.evaluation],
      findings:
        evaluationResult.findings,
      violations:
        evaluationResult.violations,
      alerts:
        evaluationResult.alerts,
      recommendations:
        evaluationResult.recommendations,
      benchmarks,
      reports:
        [report],
      trend,
      createdAt:
        now.toISOString(),
      metadata,
    });
  }
}
