import assert from "node:assert/strict";
import test from "node:test";

import {
  createClinicalValidationInput,
} from "../ai/clinicalRules/clinicalValidation/domain/ClinicalValidationInput.js";

import {
  createClinicalValidationIssue,
} from "../ai/clinicalRules/clinicalValidation/domain/ClinicalValidationIssue.js";

import {
  ClinicalValidationEngine,
} from "../ai/clinicalRules/clinicalValidation/application/ClinicalValidationEngine.js";

import {
  createClinicalValidationLibrary,
} from "../ai/clinicalRules/clinicalValidation/ClinicalValidationLibrary.js";

const input = (overrides = {}) =>
  createClinicalValidationInput({
    caseId: "CASE-033",
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
    reasoningResult: {
      selectedHypothesis: {
        diseaseId: "D-1",
      },
      requiresHumanReview: false,
    },
    consensusResult: {
      selectedConsensus: {
        hypothesisId: "D-1",
      },
      requiresHumanReview: false,
      abstentionDetected: false,
    },
    confidenceCalibrationResult: {
      finalConfidenceScore: 0.85,
      automationAllowed: true,
      requiresHumanReview: false,
    },
    uncertaintyResult: {
      totalUncertaintyScore: 0.15,
      automationAllowed: true,
      requiresHumanReview: false,
    },
    decisionTreeResult: {
      outcomeNodeId: "OUTCOME-1",
      cycleDetected: false,
      disconnectedOutcome: false,
      requiresHumanReview: false,
      nodes: [
        {
          id: "OUTCOME-1",
          sourceRef: "D-1",
        },
      ],
    },
    ...overrides,
  });

test("validation input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.evidenceScores),
    true,
  );
});

test("validation issue validates severity", () => {
  assert.throws(
    () =>
      createClinicalValidationIssue({
        id: "I-1",
        code: "X",
        severity: "UNKNOWN",
        source: "TEST",
        message: "Invalid",
      }),
    /Unsupported clinical validation severity/,
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new ClinicalValidationEngine()
        .validate(),
    /requires a valid input/,
  );
});

test("coherent case is validated", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(input());

  assert.equal(result.status, "VALIDATED");
  assert.equal(result.releaseAllowed, true);
});

test("reasoning consensus mismatch blocks release", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          consensusResult: {
            selectedConsensus: {
              hypothesisId: "D-2",
            },
            requiresHumanReview: false,
          },
        }),
      );

  assert.equal(result.status, "BLOCKED");
  assert.equal(result.releaseAllowed, false);
});

test("confidence uncertainty automation conflict blocks", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          uncertaintyResult: {
            totalUncertaintyScore: 0.8,
            automationAllowed: false,
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(
    result.blockingIssues.some(
      (issue) =>
        issue.code ===
        "AUTOMATION_STATE_CONFLICT",
    ),
    true,
  );
});

test("missing evidence creates error", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          evidenceScores: [],
        }),
      );

  assert.equal(result.status, "FAILED");
  assert.equal(
    result.errors.some(
      (issue) =>
        issue.code ===
        "NO_EVIDENCE_FOR_SELECTED_HYPOTHESIS",
    ),
    true,
  );
});

test("evidence abstention blocks release", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          evidenceScores: [
            {
              hypothesisId: "D-1",
              status: "ABSTAINED",
              normalizedScore: 0,
            },
          ],
        }),
      );

  assert.equal(result.status, "BLOCKED");
});

test("decision tree cycle blocks release", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          decisionTreeResult: {
            outcomeNodeId: "OUTCOME-1",
            cycleDetected: true,
            disconnectedOutcome: false,
            requiresHumanReview: true,
            nodes: [
              {
                id: "OUTCOME-1",
                sourceRef: "D-1",
              },
            ],
          },
        }),
      );

  assert.equal(
    result.blockingIssues.some(
      (issue) =>
        issue.code ===
        "DECISION_TREE_CYCLE",
    ),
    true,
  );
});

test("upstream review is propagated", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(
        input({
          confidenceCalibrationResult: {
            finalConfidenceScore: 0.7,
            automationAllowed: true,
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(
    result.warnings.some(
      (issue) =>
        issue.code ===
        "UPSTREAM_REVIEW_REQUIRED",
    ),
    true,
  );
});

test("custom policy can enforce classification alignment", () => {
  const result =
    new ClinicalValidationEngine({
      policy: {
        requireClassificationReasoningAlignment: true,
      },
    }).validate(
      input({
        classificationResult: {
          selectedClassification: {
            diseaseEntityId: "D-2",
          },
        },
      }),
    );

  assert.equal(
    result.errors.some(
      (issue) =>
        issue.code ===
        "CLASSIFICATION_REASONING_MISMATCH",
    ),
    true,
  );
});

test("library stores validation result", () => {
  const library =
    createClinicalValidationLibrary();

  const result =
    library.validateAndStore(input());

  assert.equal(
    library.repository.get("CASE-033"),
    result,
  );
});

test("result contains safety and audit data", () => {
  const result =
    new ClinicalValidationEngine()
      .validate(input());

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
  assert.ok(
    result.auditTrail.engineVersion,
  );
});
