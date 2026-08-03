import assert from "node:assert/strict";
import test from "node:test";

import {
  ClinicalRuleRepository,
  createClinicalRule,
  createClinicalRuleLibrary,
  validateClinicalRule,
} from "../ai/clinicalRules/index.js";

function sampleRule(overrides = {}) {
  return createClinicalRule({
    id: "CRR-TEST-001",
    version: "1.0.0",
    title: "Sample safety rule",
    category: "CLINICAL_SAFETY",
    severity: "high",
    specimenTypes: ["BONE_MARROW_ASPIRATE"],
    tags: ["TEST"],
    evidenceLevel: "UNSPECIFIED",
    applies: (input) => input?.flag === true,
    apply: (input) => ({
      ...input,
      corrected: true,
    }),
    ...overrides,
  });
}

test("clinical rule factory returns immutable rule", () => {
  const rule = sampleRule();

  assert.equal(Object.isFrozen(rule), true);
  assert.equal(Object.isFrozen(rule.specimenTypes), true);
  assert.equal(rule.id, "CRR-TEST-001");
});

test("clinical rule rejects non-semantic version", () => {
  assert.throws(
    () => sampleRule({ version: "v1" }),
    /semantic versioning/,
  );
});

test("clinical rule validator reports unsupported severity", () => {
  const rule = {
    ...sampleRule(),
    severity: "urgent",
  };

  const result = validateClinicalRule(rule);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /severity/i);
});

test("repository rejects duplicated rule ids", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  assert.throws(
    () => repository.register(sampleRule()),
    /already registered/,
  );
});

test("repository supports controlled replacement", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());
  repository.register(
    sampleRule({ version: "1.0.1" }),
    { replace: true },
  );

  assert.equal(
    repository.get("CRR-TEST-001").version,
    "1.0.1",
  );
});

test("repository queries category, severity and specimen", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  assert.equal(
    repository.getByCategory("clinical_safety").length,
    1,
  );
  assert.equal(
    repository.getBySeverity("high").length,
    1,
  );
  assert.equal(
    repository.getBySpecimenType(
      "BONE_MARROW_ASPIRATE",
    ).length,
    1,
  );
});

test("repository evaluates matching rules without mutation", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(sampleRule());

  const input = Object.freeze({ flag: true });
  const result = repository.evaluate(input);

  assert.equal(result.length, 1);
  assert.equal(result[0].matched, true);
  assert.equal(input.corrected, undefined);
});

test("repository captures applies failures as evaluation errors", () => {
  const repository = new ClinicalRuleRepository();
  repository.register(
    sampleRule({
      applies: () => {
        throw new Error("evaluation failed");
      },
    }),
  );

  const [result] = repository.evaluate({});

  assert.equal(result.matched, false);
  assert.equal(result.error, "evaluation failed");
});

test("repository applies matched rules in registration order", () => {
  const repository = new ClinicalRuleRepository();

  repository.register(
    sampleRule({
      id: "CRR-TEST-001",
      applies: () => true,
      apply: (input) => ({
        ...input,
        steps: [...(input.steps || []), "A"],
      }),
    }),
  );

  repository.register(
    sampleRule({
      id: "CRR-TEST-002",
      applies: () => true,
      apply: (input) => ({
        ...input,
        steps: [...(input.steps || []), "B"],
      }),
    }),
  );

  const result = repository.applyMatched({ steps: [] });

  assert.deepEqual(result.output.steps, ["A", "B"]);
  assert.deepEqual(
    result.applied.map((item) => item.ruleId),
    ["CRR-TEST-001", "CRR-TEST-002"],
  );
});

test("library adapts existing bone marrow safety rules", () => {
  const library = createClinicalRuleLibrary();

  assert.ok(library.summary.total > 0);
  assert.equal(
    library.summary.byCategory.CLINICAL_SAFETY,
    library.summary.total,
  );
  assert.ok(
    library.rules.every(
      (rule) =>
        rule.metadata.migratedWithoutClinicalChange === true,
    ),
  );
});

test("library contains unique registered rule ids", () => {
  const library = createClinicalRuleLibrary();
  const ids = library.rules.map((rule) => rule.id);

  assert.equal(new Set(ids).size, ids.length);
});
