import assert from "node:assert/strict";
import test from "node:test";

import {
  createClinicalSafetyGateInput,
} from "../ai/clinicalRules/clinicalSafetyGate/domain/ClinicalSafetyGateInput.js";

import {
  createClinicalSafetyGateReason,
} from "../ai/clinicalRules/clinicalSafetyGate/domain/ClinicalSafetyGateReason.js";

import {
  ClinicalSafetyGateEngine,
} from "../ai/clinicalRules/clinicalSafetyGate/application/ClinicalSafetyGateEngine.js";

import {
  createClinicalSafetyGateLibrary,
} from "../ai/clinicalRules/clinicalSafetyGate/ClinicalSafetyGateLibrary.js";

const input = (overrides = {}) =>
  createClinicalSafetyGateInput({
    caseId: "CASE-034",
    clinicalValidationResult: {
      status: "VALIDATED",
      validationScore: 1,
      requiresHumanReview: false,
      releaseAllowed: true,
      automationAllowed: true,
    },
    confidenceCalibrationResult: {
      finalConfidenceScore: 0.85,
      requiresHumanReview: false,
      automationAllowed: true,
      abstentionDetected: false,
    },
    uncertaintyResult: {
      totalUncertaintyScore: 0.15,
      requiresHumanReview: false,
      automationAllowed: true,
      abstentionDetected: false,
    },
    consensusResult: {
      divergenceDetected: false,
      abstentionDetected: false,
      requiresHumanReview: false,
    },
    reasoningResult: {
      abstentionDetected: false,
      requiresHumanReview: false,
    },
    decisionTreeResult: {
      cycleDetected: false,
      disconnectedOutcome: false,
      requiresHumanReview: false,
    },
    activeAlerts: [],
    ...overrides,
  });

test("safety gate input is immutable", () => {
  const value = input();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.activeAlerts),
    true,
  );
});

test("safety gate reason validates severity", () => {
  assert.throws(
    () =>
      createClinicalSafetyGateReason({
        id: "R-1",
        type: "VALIDATION",
        severity: "UNKNOWN",
        code: "X",
        message: "Invalid",
      }),
    /Unsupported clinical safety gate severity/,
  );
});

test("engine requires valid input", () => {
  assert.throws(
    () =>
      new ClinicalSafetyGateEngine()
        .evaluate(),
    /requires a valid input/,
  );
});

test("validated coherent case is released", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(input());

  assert.equal(
    result.decision,
    "RELEASED",
  );
  assert.equal(
    result.releaseAllowed,
    true,
  );
});

test("validation failure blocks release", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          clinicalValidationResult: {
            status: "FAILED",
            validationScore: 0.2,
            requiresHumanReview: true,
            releaseAllowed: false,
            automationAllowed: false,
          },
        }),
      );

  assert.equal(
    result.decision,
    "BLOCKED",
  );
});

test("low confidence requires human review", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          confidenceCalibrationResult: {
            finalConfidenceScore: 0.3,
            requiresHumanReview: false,
            automationAllowed: true,
            abstentionDetected: false,
          },
        }),
      );

  assert.equal(
    result.decision,
    "HUMAN_REVIEW_REQUIRED",
  );
});

test("consensus divergence blocks", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          consensusResult: {
            divergenceDetected: true,
            abstentionDetected: false,
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(
    result.blockingReasons.some(
      (reason) =>
        reason.code ===
        "CONSENSUS_DIVERGENCE",
    ),
    true,
  );
});

test("upstream abstention blocks automation", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          reasoningResult: {
            abstentionDetected: true,
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(
    result.automationAllowed,
    false,
  );
  assert.equal(
    result.decision,
    "BLOCKED",
  );
});

test("critical alert blocks release", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          activeAlerts: [
            {
              id: "A-1",
              severity: "CRITICAL",
              message: "Critical alert",
            },
          ],
        }),
      );

  assert.equal(
    result.blockingReasons.some(
      (reason) =>
        reason.code === "A-1",
    ),
    true,
  );
});

test("high alert requires human review", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          activeAlerts: [
            {
              id: "A-2",
              severity: "HIGH",
              message: "High alert",
            },
          ],
        }),
      );

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("decision tree cycle blocks", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(
        input({
          decisionTreeResult: {
            cycleDetected: true,
            disconnectedOutcome: false,
            requiresHumanReview: true,
          },
        }),
      );

  assert.equal(
    result.blockingReasons.some(
      (reason) =>
        reason.code ===
        "DECISION_TREE_CYCLE",
    ),
    true,
  );
});

test("library stores gate decision", () => {
  const library =
    createClinicalSafetyGateLibrary();

  const result =
    library.evaluateAndStore(
      input(),
    );

  assert.equal(
    library.repository.get("CASE-034"),
    result,
  );
});

test("result contains safety and audit data", () => {
  const result =
    new ClinicalSafetyGateEngine()
      .evaluate(input());

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );

  assert.ok(
    result.auditTrail.engineVersion,
  );
});
