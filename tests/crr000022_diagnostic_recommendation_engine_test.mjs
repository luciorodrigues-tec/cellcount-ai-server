import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticRecommendationEngine,
  DiagnosticRecommendationRepository,
  createDiagnosticRecommendation,
  createDiagnosticRecommendationLibrary,
} from "../ai/clinicalRules/index.js";

const recommendation = (
  id,
  overrides = {},
) =>
  createDiagnosticRecommendation({
    id,
    type: "CLINICAL_CORRELATION",
    priority: "ROUTINE",
    title: id,
    rationale: "Rationale",
    action: `Action ${id}`,
    ...overrides,
  });

const evidenceResult = (
  status = "SUPPORTED",
  overrides = {},
) => ({
  status,
  details: [
    {
      sourceType: "MORPHOLOGY",
    },
  ],
  ...overrides,
});

test("recommendation is immutable", () => {
  const value =
    recommendation("REC-1");

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(
      value.triggerStatuses,
    ),
    true,
  );
});

test("recommendation rejects unsupported priority", () => {
  assert.throws(
    () =>
      recommendation("REC-1", {
        priority: "UNKNOWN",
      }),
    /Unsupported diagnostic recommendation priority/,
  );
});

test("repository rejects duplicate recommendation", () => {
  const repository =
    new DiagnosticRecommendationRepository();

  repository.registerRecommendation(
    recommendation("REC-1"),
  );

  assert.throws(
    () =>
      repository.registerRecommendation(
        recommendation("REC-1"),
      ),
    /already registered/,
  );
});

test("engine matches trigger status", () => {
  const library =
    createDiagnosticRecommendationLibrary({
      recommendations: [
        recommendation("REC-1", {
          triggerStatuses: [
            "SUPPORTED",
          ],
        }),
      ],
    });

  const result =
    library.engine.generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult("SUPPORTED"),
    });

  assert.equal(
    result.recommendationCount,
    1,
  );
});

test("engine filters by required source type", () => {
  const library =
    createDiagnosticRecommendationLibrary({
      recommendations: [
        recommendation("REC-1", {
          requiredSourceTypes: [
            "MORPHOLOGY",
          ],
        }),
      ],
    });

  const result =
    library.engine.generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
    });

  assert.equal(
    result.recommendationCount,
    1,
  );
});

test("conflicted evidence adds urgent review", () => {
  const result =
    new DiagnosticRecommendationEngine({
      repository:
        new DiagnosticRecommendationRepository(),
    }).generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult("CONFLICTED"),
    });

  assert.equal(
    result.requiresHumanReview,
    true,
  );
  assert.equal(
    result.highestPriority,
    "URGENT",
  );
});

test("abstention blocks automation", () => {
  const result =
    new DiagnosticRecommendationEngine({
      repository:
        new DiagnosticRecommendationRepository(),
    }).generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult("ABSTAINED"),
    });

  assert.equal(
    result.automationBlocked,
    true,
  );
  assert.equal(
    result.highestPriority,
    "CRITICAL",
  );
});

test("classification review generates priority recommendation", () => {
  const result =
    new DiagnosticRecommendationEngine({
      repository:
        new DiagnosticRecommendationRepository(),
    }).generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
      classificationResult: {
        requiresHumanReview: true,
      },
    });

  assert.equal(
    result.recommendationCount,
    1,
  );
  assert.equal(
    result.highestPriority,
    "PRIORITY",
  );
});

test("alerts generate correlation recommendation", () => {
  const result =
    new DiagnosticRecommendationEngine({
      repository:
        new DiagnosticRecommendationRepository(),
    }).generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
      alerts: ["Alert"],
    });

  assert.equal(
    result.recommendationCount,
    1,
  );
});

test("duplicate actions are removed", () => {
  const library =
    createDiagnosticRecommendationLibrary({
      recommendations: [
        recommendation("REC-1", {
          action: "Same action",
        }),
        recommendation("REC-2", {
          action: "Same action",
        }),
      ],
    });

  const result =
    library.engine.generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
    });

  assert.equal(
    result.recommendationCount,
    1,
  );
});

test("critical priority is ranked first", () => {
  const library =
    createDiagnosticRecommendationLibrary({
      recommendations: [
        recommendation("REC-1", {
          priority: "ROUTINE",
        }),
        recommendation("REC-2", {
          priority: "CRITICAL",
        }),
      ],
    });

  const result =
    library.engine.generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
    });

  assert.equal(
    result.recommendations[0]
      .recommendationId,
    "REC-2",
  );
});

test("library exposes repository and engine", () => {
  const library =
    createDiagnosticRecommendationLibrary();

  assert.ok(library.repository);
  assert.ok(library.engine);
});

test("explanation avoids diagnostic finality", () => {
  const result =
    new DiagnosticRecommendationEngine({
      repository:
        new DiagnosticRecommendationRepository(),
    }).generate({
      hypothesisId: "H-1",
      evidenceResult:
        evidenceResult(),
    });

  assert.match(
    result.explanation.safetyStatement,
    /do not replace professional judgment/i,
  );
});
