import assert from "node:assert/strict";
import test from "node:test";

import {
  MasterDiagnosticOrchestrator,
  createDiagnosticOrchestrationContext,
  createMasterDiagnosticOrchestrator,
} from "../ai/clinicalRules/index.js";

const context = () =>
  createDiagnosticOrchestrationContext({
    executionId: "EXEC-001",
    input: { value: 1 },
  });

test("orchestration context is immutable", () => {
  const value = context();

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.targetIds),
    true,
  );
});

test("orchestrator skips missing services", async () => {
  const result =
    await new MasterDiagnosticOrchestrator()
      .execute(context());

  assert.equal(result.status, "COMPLETED");
  assert.equal(result.skippedStageCount, 8);
});

test("orchestrator executes configured stages in order", async () => {
  const calls = [];

  const orchestrator =
    new MasterDiagnosticOrchestrator({
      clinicalRuleExecutionService: {
        apply(input) {
          calls.push("rules");
          return {
            output: input,
            traces: [],
          };
        },
      },
      ruleEvidenceEngine: {
        enrichExecution(value) {
          calls.push("evidence");
          return value;
        },
      },
      consensusEngine: {
        evaluateAll() {
          calls.push("consensus");
          return { results: [] };
        },
      },
      differentialEngine: {
        rank() {
          calls.push("differential");
          return {
            rankedCandidates: [],
          };
        },
      },
      bayesianEngine: {
        evaluateAll() {
          calls.push("bayesian");
          return {
            rankedResults: [],
          };
        },
      },
      fusionEngine: {
        fuseAll() {
          calls.push("fusion");
          return {
            rankedResults: [],
          };
        },
      },
      rankingEngine: {
        rank() {
          calls.push("ranking");
          return {
            rankedHypotheses: [],
          };
        },
      },
      synthesisAdapter: {
        synthesize() {
          calls.push("synthesis");
          return { text: "safe" };
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.deepEqual(calls, [
    "rules",
    "evidence",
    "consensus",
    "differential",
    "bayesian",
    "fusion",
    "ranking",
    "synthesis",
  ]);
  assert.equal(
    result.completedStageCount,
    8,
  );
});

test("stage failure is isolated by default", async () => {
  const orchestrator =
    new MasterDiagnosticOrchestrator({
      clinicalRuleExecutionService: {
        apply() {
          throw new Error("rule stage failed");
        },
      },
      consensusEngine: {
        evaluateAll() {
          return { results: [] };
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.equal(
    result.status,
    "COMPLETED_WITH_ERRORS",
  );
  assert.equal(result.failedStageCount, 1);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("failFast propagates stage errors", async () => {
  const orchestrator =
    new MasterDiagnosticOrchestrator({
      clinicalRuleExecutionService: {
        apply() {
          throw new Error("fatal stage");
        },
      },
      policy: {
        failFast: true,
      },
    });

  await assert.rejects(
    () => orchestrator.execute(context()),
    /fatal stage/,
  );
});

test("abstained payload requires human review", async () => {
  const orchestrator =
    new MasterDiagnosticOrchestrator({
      bayesianEngine: {
        evaluateAll() {
          return {
            rankedResults: [
              { status: "ABSTAINED" },
            ],
          };
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("conflicted payload requires human review", async () => {
  const orchestrator =
    new MasterDiagnosticOrchestrator({
      consensusEngine: {
        evaluateAll() {
          return {
            results: [
              { status: "CONFLICTED" },
            ],
          };
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("final ranking is exposed in output", async () => {
  const expected = {
    rankedHypotheses: [
      { hypothesisId: "HYP-1" },
    ],
  };

  const orchestrator =
    new MasterDiagnosticOrchestrator({
      rankingEngine: {
        rank() {
          return expected;
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.equal(
    result.finalRanking,
    expected,
  );
});

test("synthesis adapter receives orchestration products", async () => {
  let received = null;

  const orchestrator =
    new MasterDiagnosticOrchestrator({
      rankingEngine: {
        rank() {
          return {
            rankedHypotheses: [],
          };
        },
      },
      synthesisAdapter: {
        synthesize(payload) {
          received = payload;
          return { summary: "ok" };
        },
      },
    });

  const result =
    await orchestrator.execute(context());

  assert.ok(received.context);
  assert.ok(received.ranking);
  assert.equal(
    result.synthesis.summary,
    "ok",
  );
});

test("factory returns orchestrator", () => {
  const value =
    createMasterDiagnosticOrchestrator();

  assert.ok(
    value instanceof
      MasterDiagnosticOrchestrator,
  );
});

test("safety statement avoids diagnostic finality", async () => {
  const result =
    await new MasterDiagnosticOrchestrator()
      .execute(context());

  assert.match(
    result.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
