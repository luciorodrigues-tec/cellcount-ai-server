import assert from "node:assert/strict";
import test from "node:test";

import {
  createQualityPeriod,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityPeriod.js";

import {
  createQualityThreshold,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityThreshold.js";

import {
  createQualityMetric,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityMetric.js";

import {
  QualityScore,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityScore.js";

import {
  QualityThresholdEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityThresholdEngine.js";

import {
  QualityScoreCalculator,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityScoreCalculator.js";

import {
  QualityTrendEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityTrendEngine.js";

import {
  QualityFindingEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityFindingEngine.js";

import {
  QualityAlertEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityAlertEngine.js";

import {
  QualityRecommendationEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityRecommendationEngine.js";

import {
  QualityEvaluationEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityEvaluationEngine.js";

import {
  QualityReportEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityReportEngine.js";

import {
  QualityAssuranceSerializer,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityAssuranceSerializer.js";

import {
  QualityAssuranceExporter,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityAssuranceExporter.js";

import {
  QualityAssuranceEngine,
} from "../ai/clinicalGovernance/qualityAssurance/application/QualityAssuranceEngine.js";

const fixedClock = () =>
  new Date("2026-07-30T06:00:00.000Z");

const metric = (value = 0.9) =>
  createQualityMetric({
    metricId: "M-CONFIDENCE",
    name: "Mean confidence",
    category: "AI",
    value,
    threshold:
      createQualityThreshold({
        thresholdId: "T-CONFIDENCE",
        operator: "GTE",
        value: 0.8,
        severity: "HIGH",
      }),
  });

test("threshold engine detects violation", () => {
  const result =
    new QualityThresholdEngine()
      .evaluate(metric(0.5), {
        occurredAt: fixedClock(),
      });

  assert.equal(result.violated, true);
});

test("threshold engine accepts conforming metric", () => {
  const result =
    new QualityThresholdEngine()
      .evaluate(metric(0.9), {
        occurredAt: fixedClock(),
      });

  assert.equal(result.violated, false);
});

test("score calculator returns bounded score", () => {
  const score =
    new QualityScoreCalculator()
      .calculate({
        metrics: [metric()],
        violations: [],
        alerts: [],
      });

  assert.equal(score.value, 100);
});

test("trend engine detects degradation", () => {
  const trend =
    new QualityTrendEngine()
      .calculate([
        new QualityScore(90),
        new QualityScore(70),
      ]);

  assert.equal(
    trend.direction,
    "DEGRADING",
  );
});

test("finding engine creates findings", () => {
  const violation =
    new QualityThresholdEngine()
      .evaluate(metric(0.5), {
        occurredAt: fixedClock(),
      }).violation;

  const findings =
    new QualityFindingEngine()
      .build([violation], {
        detectedAt: fixedClock(),
      });

  assert.equal(findings.length, 1);
});

test("alert engine creates high alert", () => {
  const violation =
    new QualityThresholdEngine()
      .evaluate(metric(0.5), {
        occurredAt: fixedClock(),
      }).violation;

  const finding =
    new QualityFindingEngine()
      .build([violation], {
        detectedAt: fixedClock(),
      })[0];

  const alerts =
    new QualityAlertEngine()
      .build([finding], {
        createdAt: fixedClock(),
      });

  assert.equal(alerts.length, 1);
});

test("recommendation engine requires review for high finding", () => {
  const violation =
    new QualityThresholdEngine()
      .evaluate(metric(0.5), {
        occurredAt: fixedClock(),
      }).violation;

  const finding =
    new QualityFindingEngine()
      .build([violation], {
        detectedAt: fixedClock(),
      })[0];

  const recommendations =
    new QualityRecommendationEngine()
      .build([finding]);

  assert.equal(
    recommendations[0].requiresHumanReview,
    true,
  );
});

test("evaluation engine produces non-conforming result", () => {
  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine:
        new QualityThresholdEngine(),
      scoreCalculator:
        new QualityScoreCalculator(),
      findingEngine:
        new QualityFindingEngine(),
      alertEngine:
        new QualityAlertEngine(),
      recommendationEngine:
        new QualityRecommendationEngine(),
      clock: fixedClock,
    });

  const result =
    evaluationEngine.evaluate({
      evaluationId: "EVAL-1",
      metrics: [metric(0.5)],
    });

  assert.equal(
    result.evaluation.status,
    "NON_CONFORMING",
  );
});

test("quality assurance engine builds aggregate", () => {
  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine:
        new QualityThresholdEngine(),
      scoreCalculator:
        new QualityScoreCalculator(),
      findingEngine:
        new QualityFindingEngine(),
      alertEngine:
        new QualityAlertEngine(),
      recommendationEngine:
        new QualityRecommendationEngine(),
      clock: fixedClock,
    });

  const engine =
    new QualityAssuranceEngine({
      evaluationEngine,
      trendEngine:
        new QualityTrendEngine(),
      reportEngine:
        new QualityReportEngine(),
      clock: fixedClock,
    });

  const aggregate =
    engine.evaluate({
      qualityAssuranceId:
        "QAE-APP-0001",
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      metrics: [metric(0.5)],
    });

  assert.equal(
    aggregate.evaluations.length,
    1,
  );
  assert.equal(
    aggregate.reports.length,
    1,
  );
});

test("serializer round-trips aggregate", () => {
  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine:
        new QualityThresholdEngine(),
      scoreCalculator:
        new QualityScoreCalculator(),
      findingEngine:
        new QualityFindingEngine(),
      alertEngine:
        new QualityAlertEngine(),
      recommendationEngine:
        new QualityRecommendationEngine(),
      clock: fixedClock,
    });

  const aggregate =
    new QualityAssuranceEngine({
      evaluationEngine,
      trendEngine:
        new QualityTrendEngine(),
      reportEngine:
        new QualityReportEngine(),
      clock: fixedClock,
    }).evaluate({
      qualityAssuranceId:
        "QAE-APP-0002",
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      metrics: [metric()],
    });

  const serializer =
    new QualityAssuranceSerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(aggregate),
    );

  assert.equal(
    restored.qualityAssuranceId.toString(),
    "QAE-APP-0002",
  );
});

test("exporter creates JSON payload", () => {
  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine:
        new QualityThresholdEngine(),
      scoreCalculator:
        new QualityScoreCalculator(),
      findingEngine:
        new QualityFindingEngine(),
      alertEngine:
        new QualityAlertEngine(),
      recommendationEngine:
        new QualityRecommendationEngine(),
      clock: fixedClock,
    });

  const aggregate =
    new QualityAssuranceEngine({
      evaluationEngine,
      trendEngine:
        new QualityTrendEngine(),
      reportEngine:
        new QualityReportEngine(),
      clock: fixedClock,
    }).evaluate({
      qualityAssuranceId:
        "QAE-APP-0003",
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      metrics: [metric()],
    });

  const exported =
    new QualityAssuranceExporter()
      .exportJson(aggregate);

  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("quality report summarizes conforming metrics", () => {
  const report =
    new QualityReportEngine()
      .build({
        reportId: "REPORT-1",
        title: "QA",
        period:
          createQualityPeriod({
            startedAt:
              "2026-07-01T00:00:00.000Z",
            endedAt:
              "2026-07-31T23:59:59.000Z",
          }),
        score:
          new QualityScore(100),
        metrics: [metric()],
        generatedAt:
          fixedClock(),
      });

  assert.match(
    report.summary,
    /conforming/i,
  );
});

test("aggregate carries safety-sensitive recommendations", () => {
  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine:
        new QualityThresholdEngine(),
      scoreCalculator:
        new QualityScoreCalculator(),
      findingEngine:
        new QualityFindingEngine(),
      alertEngine:
        new QualityAlertEngine(),
      recommendationEngine:
        new QualityRecommendationEngine(),
      clock: fixedClock,
    });

  const aggregate =
    new QualityAssuranceEngine({
      evaluationEngine,
      trendEngine:
        new QualityTrendEngine(),
      reportEngine:
        new QualityReportEngine(),
      clock: fixedClock,
    }).evaluate({
      qualityAssuranceId:
        "QAE-APP-0004",
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      metrics: [metric(0.5)],
    });

  assert.equal(
    aggregate.recommendations[0]
      .requiresHumanReview,
    true,
  );
});
