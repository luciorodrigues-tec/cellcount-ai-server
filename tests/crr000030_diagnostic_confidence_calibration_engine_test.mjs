import assert from "node:assert/strict";
import test from "node:test";

import {
  confidenceLevelFromScore,
} from "../ai/clinicalRules/confidenceCalibration/domain/ConfidenceLevel.js";

import {
  createConfidenceFactor,
} from "../ai/clinicalRules/confidenceCalibration/domain/ConfidenceFactor.js";

import {
  createDiagnosticConfidenceInput,
} from "../ai/clinicalRules/confidenceCalibration/domain/DiagnosticConfidenceInput.js";

import {
  DiagnosticConfidenceCalibrationEngine,
} from "../ai/clinicalRules/confidenceCalibration/application/DiagnosticConfidenceCalibrationEngine.js";

import {
  createDiagnosticConfidenceCalibrationLibrary,
} from "../ai/clinicalRules/confidenceCalibration/DiagnosticConfidenceCalibrationLibrary.js";

const input = (overrides = {}) =>
  createDiagnosticConfidenceInput({
    caseId: "CASE-030",
    classificationResult: {
      selectedClassification: {
        diseaseEntityId: "D-1",
      },
    },
    evidenceScores: [
      {
        hypothesisId: "D-1",
        status: "SUPPORTED",
        normalizedScore: 0.8,
      },
    ],
    syndromeResult: {
      selectedSyndrome: {
        id: "S-1",
      },
      rankedSyndromes: [
        {
          syndromeId: "S-1",
          score: 0.85,
        },
      ],
    },
    reasoningResult: {
      selectedHypothesis: {
        diseaseId: "D-1",
        compositeScore: 0.82,
      },
      conflictDetected: false,
      abstentionDetected: false,
    },
    consensusResult: {
      selectedConsensus: {
        hypothesisId: "D-1",
        consensusScore: 0.9,
      },
      divergenceDetected: false,
      abstentionDetected: false,
    },
    imageQualityScore: 0.9,
    multiImageConsistencyScore: 0.85,
    ...overrides,
  });

test("confidence input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.evidenceScores),
    true,
  );
});

test("confidence factor validates range", () => {
  assert.throws(
    () =>
      createConfidenceFactor({
        id: "F-1",
        source: "TEST",
        direction: "POSITIVE",
        value: 2,
      }),
    /between 0 and 1/,
  );
});

test("confidence levels map correctly", () => {
  assert.equal(
    confidenceLevelFromScore(0.1),
    "VERY_LOW",
  );
  assert.equal(
    confidenceLevelFromScore(0.9),
    "VERY_HIGH",
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new DiagnosticConfidenceCalibrationEngine()
        .calibrate(),
    /requires a valid input/,
  );
});

test("strong convergence produces high confidence", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(input());

  assert.ok(
    result.finalConfidenceScore >= 0.65,
  );
  assert.ok(
    ["HIGH", "VERY_HIGH"].includes(
      result.confidenceLevel,
    ),
  );
});

test("missing consensus reduces confidence", () => {
  const engine =
    new DiagnosticConfidenceCalibrationEngine();

  const complete =
    engine.calibrate(input());

  const incomplete =
    engine.calibrate(
      input({
        consensusResult: {
          selectedConsensus: null,
          divergenceDetected: false,
          abstentionDetected: false,
        },
      }),
    );

  assert.ok(
    incomplete.finalConfidenceScore <
      complete.finalConfidenceScore,
  );
});

test("residual conflict requires human review", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(
        input({
          consensusResult: {
            selectedConsensus: {
              hypothesisId: "D-1",
              consensusScore: 0.7,
            },
            divergenceDetected: true,
            abstentionDetected: false,
          },
        }),
      );

  assert.equal(
    result.residualConflictDetected,
    true,
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("abstention blocks automation", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(
        input({
          consensusResult: {
            selectedConsensus: null,
            divergenceDetected: false,
            abstentionDetected: true,
          },
        }),
      );

  assert.equal(
    result.abstentionDetected,
    true,
  );
  assert.equal(
    result.automationAllowed,
    false,
  );
});

test("overconfidence is detected", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(
        input({
          declaredConfidence: 1,
          consensusResult: {
            selectedConsensus: null,
            divergenceDetected: true,
            abstentionDetected: false,
          },
        }),
      );

  assert.equal(
    result.overconfidenceDetected,
    true,
  );
});

test("underconfidence is detected", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(
        input({
          declaredConfidence: 0.1,
        }),
      );

  assert.equal(
    result.underconfidenceDetected,
    true,
  );
});

test("additional factors are preserved", () => {
  const extra =
    createConfidenceFactor({
      id: "EXTRA-1",
      source: "HUMAN_REVIEW",
      direction: "POSITIVE",
      value: 1,
      weight: 0.1,
    });

  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(
        input({
          additionalFactors: [extra],
        }),
      );

  assert.ok(
    result.confidenceFactors.some(
      (factor) => factor.id === "EXTRA-1",
    ),
  );
});

test("library stores calibrated result", () => {
  const library =
    createDiagnosticConfidenceCalibrationLibrary();

  const result =
    library.calibrateAndStore(input());

  assert.equal(
    library.repository.get("CASE-030"),
    result,
  );
});

test("result includes audit and safety explanation", () => {
  const result =
    new DiagnosticConfidenceCalibrationEngine()
      .calibrate(input());

  assert.ok(result.auditTrail.policyVersion);
  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
  assert.match(
    result.explanation.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
