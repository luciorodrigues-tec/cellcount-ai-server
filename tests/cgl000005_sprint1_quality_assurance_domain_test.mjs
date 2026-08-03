import assert from "node:assert/strict";
import test from "node:test";

import {
  QualityAssuranceId,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityAssuranceId.js";

import {
  assertQualityCategory,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityCategory.js";

import {
  assertQualitySeverity,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualitySeverity.js";

import {
  createQualityPeriod,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityPeriod.js";

import {
  QualityScore,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityScore.js";

import {
  createQualityThreshold,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityThreshold.js";

import {
  createQualityMetric,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityMetric.js";

import {
  createQualityAlert,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityAlert.js";

import {
  createQualityRecommendation,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityRecommendation.js";

import {
  createQualityTrend,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityTrend.js";

import {
  QualityAssurance,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityAssurance.js";

test("QualityAssuranceId validates format", () => {
  assert.throws(
    () => new QualityAssuranceId("invalid"),
    /must match/,
  );

  assert.equal(
    new QualityAssuranceId("QAE-CLIN-0001").toString(),
    "QAE-CLIN-0001",
  );
});

test("quality category validates value", () => {
  assert.throws(
    () => assertQualityCategory("UNKNOWN"),
    /Unsupported quality category/,
  );
});

test("quality severity validates value", () => {
  assert.throws(
    () => assertQualitySeverity("UNKNOWN"),
    /Unsupported quality severity/,
  );
});

test("quality period validates date order", () => {
  assert.throws(
    () =>
      createQualityPeriod({
        startedAt:
          "2026-08-01T00:00:00.000Z",
        endedAt:
          "2026-07-01T00:00:00.000Z",
      }),
    /must not precede/,
  );
});

test("quality score validates range", () => {
  assert.throws(
    () => new QualityScore(101),
    /between 0 and 100/,
  );
});

test("quality threshold validates operator", () => {
  assert.throws(
    () =>
      createQualityThreshold({
        thresholdId: "T-1",
        operator: "UNKNOWN",
        value: 1,
      }),
    /Unsupported quality threshold operator/,
  );
});

test("quality metric is immutable", () => {
  const metric =
    createQualityMetric({
      metricId: "M-1",
      name: "Confidence",
      category: "AI",
      value: 0.9,
    });

  assert.equal(Object.isFrozen(metric), true);
});

test("quality alert detects critical severity", () => {
  const alert =
    createQualityAlert({
      alertId: "A-1",
      code: "CRITICAL_DRIFT",
      message: "Critical drift",
      severity: "CRITICAL",
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  const aggregate =
    new QualityAssurance({
      qualityAssuranceId:
        new QualityAssuranceId("QAE-CLIN-0002"),
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      alerts: [alert],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    aggregate.hasCriticalAlert(),
    true,
  );
});

test("quality recommendation validates priority", () => {
  assert.throws(
    () =>
      createQualityRecommendation({
        recommendationId: "R-1",
        text: "Review process",
        priority: 0,
      }),
    /positive integer/,
  );
});

test("quality trend validates direction", () => {
  assert.throws(
    () =>
      createQualityTrend({
        direction: "UNKNOWN",
      }),
    /Unsupported quality trend/,
  );
});

test("quality assurance rejects duplicate metrics", () => {
  const metric =
    createQualityMetric({
      metricId: "M-1",
      name: "Confidence",
      category: "AI",
      value: 0.9,
    });

  assert.throws(
    () =>
      new QualityAssurance({
        qualityAssuranceId:
          new QualityAssuranceId("QAE-CLIN-0003"),
        period:
          createQualityPeriod({
            startedAt:
              "2026-07-01T00:00:00.000Z",
            endedAt:
              "2026-07-31T23:59:59.000Z",
          }),
        metrics: [metric, metric],
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /duplicate metric ids/,
  );
});

test("quality assurance sorts recommendations", () => {
  const aggregate =
    new QualityAssurance({
      qualityAssuranceId:
        new QualityAssuranceId("QAE-CLIN-0004"),
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      recommendations: [
        createQualityRecommendation({
          recommendationId: "R-2",
          text: "Later",
          priority: 20,
        }),
        createQualityRecommendation({
          recommendationId: "R-1",
          text: "First",
          priority: 10,
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    aggregate.recommendations[0].recommendationId,
    "R-1",
  );
});

test("quality assurance is immutable", () => {
  const aggregate =
    new QualityAssurance({
      qualityAssuranceId:
        new QualityAssuranceId("QAE-CLIN-0005"),
      period:
        createQualityPeriod({
          startedAt:
            "2026-07-01T00:00:00.000Z",
          endedAt:
            "2026-07-31T23:59:59.000Z",
        }),
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    Object.isFrozen(aggregate),
    true,
  );
});
