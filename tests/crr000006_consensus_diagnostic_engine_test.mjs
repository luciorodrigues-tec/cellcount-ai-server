import assert from "node:assert/strict";
import test from "node:test";

import {
  ConsensusDiagnosticEngine,
  DiagnosticHypothesisRepository,
  createConsensusDiagnosticLibrary,
  createDiagnosticHypothesis,
} from "../ai/clinicalRules/index.js";

function hypothesis(overrides = {}) {
  return createDiagnosticHypothesis({
    id: "HYP-001",
    label: "Test hypothesis",
    supportingRuleIds: ["RULE-SUPPORT"],
    opposingRuleIds: ["RULE-OPPOSE"],
    requiredRuleIds: [],
    excludedRuleIds: [],
    ...overrides,
  });
}

function execution(traces) {
  return Object.freeze({
    executionId: "EXEC-001",
    traces: Object.freeze(traces),
  });
}

function trace({
  id,
  ruleId,
  severity = "info",
  evidenceLevel = "UNSPECIFIED",
  requiresHumanReview = false,
  confidence = null,
}) {
  return Object.freeze({
    traceId: id,
    executionId: "EXEC-001",
    ruleId,
    ruleVersion: "1.0.0",
    matched: true,
    severity,
    evidenceLevel,
    confidence,
    explanation: Object.freeze({
      rationale: `${ruleId} rationale`,
      requiresHumanReview,
    }),
    metadata: Object.freeze({ severity }),
  });
}

test("diagnostic hypothesis is immutable", () => {
  const value = hypothesis();

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.supportingRuleIds),
    true,
  );
});

test("repository rejects duplicated hypotheses", () => {
  const repository =
    new DiagnosticHypothesisRepository();

  repository.register(hypothesis());

  assert.throws(
    () => repository.register(hypothesis()),
    /already registered/,
  );
});

test("consensus supports hypothesis when threshold is met", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
      }),
    ]),
  });

  assert.equal(result.status, "SUPPORTED");
  assert.equal(result.supportRatio, 1);
});

test("consensus detects material conflict", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
      policy: {
        conflictRatioThreshold: 0.25,
      },
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
      }),
      trace({
        id: "TRACE-2",
        ruleId: "RULE-OPPOSE",
      }),
    ]),
  });

  assert.equal(result.status, "CONFLICTED");
  assert.equal(result.requiresHumanReview, true);
});

test("blocking vote forces abstention", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
        severity: "blocking",
      }),
    ]),
  });

  assert.equal(result.status, "ABSTAINED");
  assert.equal(
    result.reason,
    "BLOCKING_OR_CRITICAL_VOTE",
  );
});

test("missing required rule forces abstention", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(
    hypothesis({
      requiredRuleIds: ["RULE-REQUIRED"],
    }),
  );

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
      }),
    ]),
  });

  assert.equal(result.status, "ABSTAINED");
  assert.deepEqual(
    result.missingRequiredRules,
    ["RULE-REQUIRED"],
  );
});

test("excluded rule rejects hypothesis", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(
    hypothesis({
      excludedRuleIds: ["RULE-EXCLUDE"],
    }),
  );

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
      }),
      trace({
        id: "TRACE-2",
        ruleId: "RULE-EXCLUDE",
      }),
    ]),
  });

  assert.equal(result.status, "REJECTED");
});

test("guideline evidence receives higher configured weight", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
        evidenceLevel: "GUIDELINE",
      }),
    ]),
  });

  assert.equal(result.supportWeight, 1.8);
});

test("confidence scales vote weight", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const result = engine.evaluateHypothesis({
    hypothesisId: "HYP-001",
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
        confidence: 0.5,
      }),
    ]),
  });

  assert.equal(result.supportWeight, 0.5);
  assert.equal(
    result.status,
    "INSUFFICIENT_EVIDENCE",
  );
});

test("evaluateAll summarizes supported and conflicted hypotheses", () => {
  const repository =
    new DiagnosticHypothesisRepository();

  repository.register(hypothesis());
  repository.register(
    hypothesis({
      id: "HYP-002",
      supportingRuleIds: ["RULE-X"],
      opposingRuleIds: ["RULE-Y"],
    }),
  );

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    });

  const summary = engine.evaluateAll({
    execution: execution([
      trace({
        id: "TRACE-1",
        ruleId: "RULE-SUPPORT",
      }),
      trace({
        id: "TRACE-2",
        ruleId: "RULE-X",
      }),
      trace({
        id: "TRACE-3",
        ruleId: "RULE-Y",
      }),
    ]),
  });

  assert.equal(summary.totalHypotheses, 2);
  assert.equal(summary.supportedCount, 1);
  assert.equal(summary.conflictedCount, 1);
});

test("consensus explanation avoids diagnostic finality", () => {
  const repository =
    new DiagnosticHypothesisRepository();
  repository.register(hypothesis());

  const result =
    new ConsensusDiagnosticEngine({
      hypothesisRepository: repository,
    }).evaluateHypothesis({
      hypothesisId: "HYP-001",
      execution: execution([
        trace({
          id: "TRACE-1",
          ruleId: "RULE-SUPPORT",
        }),
      ]),
    });

  assert.match(
    result.explanation.safetyStatement,
    /not a diagnosis/i,
  );
});

test("consensus library exposes repository and engine", () => {
  const library =
    createConsensusDiagnosticLibrary({
      hypotheses: [hypothesis()],
    });

  assert.ok(library.hypothesisRepository);
  assert.ok(library.engine);
  assert.equal(library.hypotheses.length, 1);
});
