import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiagnosticUncertaintyInput,
} from "../ai/clinicalRules/diagnosticUncertainty/domain/DiagnosticUncertaintyInput.js";

import {
  createUncertaintyFactor,
} from "../ai/clinicalRules/diagnosticUncertainty/domain/UncertaintyFactor.js";

import {
  DiagnosticUncertaintyEngine,
} from "../ai/clinicalRules/diagnosticUncertainty/application/DiagnosticUncertaintyEngine.js";

import {
  createDiagnosticUncertaintyLibrary,
} from "../ai/clinicalRules/diagnosticUncertainty/DiagnosticUncertaintyLibrary.js";

const input = (overrides = {}) =>
  createDiagnosticUncertaintyInput({
    caseId: "CASE-031",
    confidenceCalibrationResult: {
      finalConfidenceScore: 0.85,
      residualConflictDetected: false,
      abstentionDetected: false,
    },
    consensusResult: {
      divergenceDetected: false,
      abstentionDetected: false,
      rankedConsensus: [
        {
          hypothesisId: "D-1",
          consensusScore: 0.9,
        },
        {
          hypothesisId: "D-2",
          consensusScore: 0.4,
        },
      ],
    },
    reasoningResult: {
      conflictDetected: false,
      abstentionDetected: false,
      rankedHypotheses: [
        {
          diseaseId: "D-1",
          compositeScore: 0.88,
        },
        {
          diseaseId: "D-2",
          compositeScore: 0.35,
        },
      ],
    },
    evidenceScores: [
      {
        hypothesisId: "D-1",
        status: "SUPPORTED",
      },
    ],
    imageQualityScore: 0.9,
    multiImageConsistencyScore: 0.9,
    ...overrides,
  });

test("uncertainty input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.evidenceScores),
    true,
  );
});

test("uncertainty factor validates severity", () => {
  assert.throws(
    () =>
      createUncertaintyFactor({
        id: "F-1",
        type: "EPISTEMIC",
        severity: 2,
        source: "TEST",
        description: "Invalid",
      }),
    /between 0 and 1/,
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new DiagnosticUncertaintyEngine()
        .evaluate(),
    /requires a valid input/,
  );
});

test("high confidence produces low residual uncertainty", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(input());

  assert.ok(
    result.residualUncertainty <= 0.15,
  );
});

test("similar competing hypotheses increase uncertainty", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          competingHypotheses: [
            { score: 0.8 },
            { score: 0.79 },
          ],
        }),
      );

  assert.ok(
    result.competitionUncertainty > 0.9,
  );
});

test("missing data creates epistemic uncertainty", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          missingData: [
            "Cytogenetic result",
            "Flow cytometry",
          ],
        }),
      );

  assert.ok(
    result.epistemicUncertainty > 0,
  );
  assert.ok(
    result.unresolvedQuestions.length >= 2,
  );
});

test("low image quality creates observational uncertainty", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          imageQualityScore: 0.2,
        }),
      );

  assert.ok(
    result.observationalUncertainty >= 0.8,
  );
});

test("conflict requires human review", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          consensusResult: {
            divergenceDetected: true,
            abstentionDetected: false,
            rankedConsensus: [],
          },
        }),
      );

  assert.equal(
    result.conflictUncertainty,
    1,
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("abstention blocks automation", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          confidenceCalibrationResult: {
            finalConfidenceScore: 0.3,
            residualConflictDetected: false,
            abstentionDetected: true,
          },
        }),
      );

  assert.equal(
    result.automationAllowed,
    false,
  );
});

test("critical uncertainty blocks automation", () => {
  const result =
    new DiagnosticUncertaintyEngine({
      policy: {
        criticalUncertaintyThreshold: 0.5,
      },
    }).evaluate(
      input({
        confidenceCalibrationResult: {
          finalConfidenceScore: 0.1,
          residualConflictDetected: true,
          abstentionDetected: false,
        },
        missingData: [
          "Missing A",
          "Missing B",
          "Missing C",
        ],
        imageQualityScore: 0.1,
        multiImageConsistencyScore: 0.1,
      }),
    );

  assert.equal(
    result.automationAllowed,
    false,
  );
});

test("recommendations are deduplicated", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(
        input({
          missingData: [
            "Missing A",
          ],
          imageQualityScore: 0.1,
        }),
      );

  assert.equal(
    new Set(
      result.recommendations,
    ).size,
    result.recommendations.length,
  );
});

test("library stores uncertainty result", () => {
  const library =
    createDiagnosticUncertaintyLibrary();

  const result =
    library.evaluateAndStore(
      input(),
    );

  assert.equal(
    library.repository.get("CASE-031"),
    result,
  );
});

test("result includes safety statement and audit trail", () => {
  const result =
    new DiagnosticUncertaintyEngine()
      .evaluate(input());

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
  assert.ok(
    result.auditTrail.engineVersion,
  );
});
