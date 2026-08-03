import assert from "node:assert/strict";
import test from "node:test";

import {
  ClinicalRuleExecutionService,
  ClinicalRuleRepository,
  buildClinicalRuleExplanation,
  createClinicalRule,
  createClinicalRuleLibrary,
  stableFingerprint,
} from "../ai/clinicalRules/index.js";

function fixedClock() {
  const times = [
    "2026-07-28T12:00:00.000Z",
    "2026-07-28T12:00:00.010Z",
    "2026-07-28T12:00:00.015Z",
    "2026-07-28T12:00:00.020Z",
    "2026-07-28T12:00:00.025Z",
    "2026-07-28T12:00:00.030Z",
  ].map((value) => new Date(value));

  let index = 0;
  return () => times[index++] || times[times.length - 1];
}

function idFactory() {
  let index = 0;
  return () => `trace-id-${++index}`;
}

function sampleRule(overrides = {}) {
  return createClinicalRule({
    id: "CRR-TRACE-001",
    version: "1.0.0",
    title: "Traceable sample rule",
    description: "Applies a deterministic correction.",
    category: "CLINICAL_SAFETY",
    severity: "critical",
    specimenTypes: ["BONE_MARROW_ASPIRATE"],
    evidenceLevel: "UNSPECIFIED",
    applies: (input) => input?.flag === true,
    apply: (input) => ({
      ...input,
      result: {
        ...(input.result || {}),
        corrected: true,
      },
    }),
    metadata: {
      field: "result.corrected",
      reason: "flag=true",
      requiresHumanReview: true,
    },
    ...overrides,
  });
}

test("stable fingerprint is independent of object key order", () => {
  assert.equal(
    stableFingerprint({ a: 1, b: 2 }),
    stableFingerprint({ b: 2, a: 1 }),
  );
});

test("explanation preserves rule identity and safety language", () => {
  const explanation = buildClinicalRuleExplanation({
    rule: sampleRule(),
    matched: true,
    applied: true,
    field: "result.corrected",
    reason: "flag=true",
  });

  assert.match(explanation.headline, /CRR-TRACE-001/);
  assert.equal(explanation.requiresHumanReview, true);
  assert.match(explanation.safetyStatement, /revisão humana/i);
});

test("execution service requires a repository", () => {
  assert.throws(
    () => new ClinicalRuleExecutionService(),
    /requires a repository/,
  );
});

test("evaluation creates trace without applying mutation", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const service = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  });

  const input = Object.freeze({
    flag: true,
    result: Object.freeze({ corrected: false }),
  });

  const execution = service.evaluate(input);

  assert.equal(execution.mode, "EVALUATE");
  assert.equal(execution.matchedCount, 1);
  assert.equal(execution.appliedCount, 0);
  assert.equal(execution.output, input);
  assert.equal(execution.traces[0].before, false);
  assert.equal(execution.traces[0].after, false);
});

test("apply mode records before and after field snapshots", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const service = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  });

  const execution = service.apply({
    flag: true,
    result: { corrected: false },
  });

  const [trace] = execution.traces;

  assert.equal(trace.matched, true);
  assert.equal(trace.applied, true);
  assert.equal(trace.before, false);
  assert.equal(trace.after, true);
  assert.equal(execution.output.result.corrected, true);
});

test("trace stores rule and repository versions", () => {
  const repository = new ClinicalRuleRepository({
    version: "CRR-TEST-v2",
  });
  repository.register(sampleRule({ version: "2.1.0" }));

  const execution = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).evaluate({ flag: false });

  assert.equal(execution.repositoryVersion, "CRR-TEST-v2");
  assert.equal(execution.traces[0].ruleVersion, "2.1.0");
  assert.equal(
    execution.traces[0].metadata.repositoryVersion,
    "CRR-TEST-v2",
  );
});

test("rule failures become trace errors without crashing execution", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(
    sampleRule({
      applies: () => {
        throw new Error("trace evaluation failure");
      },
    }),
  );

  const execution = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).evaluate({});

  assert.equal(execution.errorCount, 1);
  assert.equal(
    execution.traces[0].error,
    "trace evaluation failure",
  );
  assert.match(
    execution.traces[0].explanation.outcome,
    /revisão técnica/i,
  );
});

test("critical matched rule requires human review", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const execution = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).evaluate({ flag: true });

  assert.equal(execution.requiresHumanReview, true);
});

test("audit JSON excludes raw input and output payloads", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const execution = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).apply({
    flag: true,
    patientName: "PRIVATE PATIENT",
    result: { corrected: false },
  });

  const audit = execution.toAuditJSON();
  const serialized = JSON.stringify(audit);

  assert.equal("output" in audit, false);
  assert.doesNotMatch(serialized, /PRIVATE PATIENT/);
  assert.equal(audit.inputFingerprint.length, 64);
  assert.equal(audit.outputFingerprint.length, 64);
});

test("trace objects and trace arrays are immutable", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const execution = new ClinicalRuleExecutionService({
    repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).evaluate({ flag: true });

  assert.equal(Object.isFrozen(execution), true);
  assert.equal(Object.isFrozen(execution.traces), true);
  assert.equal(Object.isFrozen(execution.traces[0]), true);
  assert.equal(
    Object.isFrozen(execution.traces[0].explanation),
    true,
  );
});

test("existing bone marrow rules produce explainable traces", () => {
  const library = createClinicalRuleLibrary();

  const execution = new ClinicalRuleExecutionService({
    repository: library.repository,
    clock: fixedClock(),
    idFactory: idFactory(),
  }).evaluate({
    requiresHumanReview: false,
    overallAssessment: {
      requiresHumanReview: false,
    },
    marrowLimitations: [],
    boneMarrowOutputContract: {
      complete: true,
    },
    boneMarrowClinicalReasoning: {
      adequacy: { assessable: true },
    },
  });

  assert.equal(
    execution.evaluatedCount,
    library.summary.total,
  );
  assert.ok(
    execution.traces.every(
      (trace) => trace.explanation.headline,
    ),
  );
  assert.ok(
    execution.traces.every(
      (trace) => trace.ruleVersion === "1.0.0",
    ),
  );
});
