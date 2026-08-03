import assert from "node:assert/strict";
import test from "node:test";

import {
  RuleEvidenceEngine,
  RuleEvidenceRepository,
  createClinicalRuleLibrary,
  createEvidenceSource,
  createRuleEvidenceBinding,
  createRuleEvidenceLibrary,
  validateRuleEvidenceBinding,
} from "../ai/clinicalRules/index.js";

function source(overrides = {}) {
  return createEvidenceSource({
    id: "EVIDENCE-TEST-001",
    title: "Test guideline",
    sourceType: "GUIDELINE",
    citation: "Test Organization. Test guideline.",
    year: 2026,
    status: "ACTIVE",
    ...overrides,
  });
}

function binding(overrides = {}) {
  return createRuleEvidenceBinding({
    ruleId: "CRR-TEST-001",
    ruleVersion: "1.0.0",
    evidenceLevel: "GUIDELINE",
    sourceIds: ["EVIDENCE-TEST-001"],
    rationale: "The rule is directly supported by the source.",
    limitations: ["Test-only evidence."],
    status: "ACTIVE",
    ...overrides,
  });
}

test("evidence source is immutable and validated", () => {
  const value = source();

  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.authors), true);
  assert.equal(value.sourceType, "GUIDELINE");
});

test("evidence source rejects malformed DOI", () => {
  assert.throws(
    () => source({ doi: "not-a-doi" }),
    /invalid format/,
  );
});

test("binding rejects unsupported evidence level", () => {
  assert.throws(
    () => binding({ evidenceLevel: "VERY_HIGH" }),
    /Unsupported evidence level/,
  );
});

test("binding validator warns about level without sources", () => {
  const value = createRuleEvidenceBinding({
    ruleId: "CRR-TEST-001",
    ruleVersion: "1.0.0",
    evidenceLevel: "GUIDELINE",
    sourceIds: [],
  });

  const validation = validateRuleEvidenceBinding(value);

  assert.equal(validation.valid, true);
  assert.equal(validation.warnings.length, 1);
});

test("repository rejects bindings to unknown sources", () => {
  const repository = new RuleEvidenceRepository();

  assert.throws(
    () => repository.registerBinding(binding()),
    /Unknown evidence source/,
  );
});

test("repository resolves complete evidence package", () => {
  const repository = new RuleEvidenceRepository();
  repository.registerSource(source());
  repository.registerBinding(binding());

  const resolved = repository.resolve(
    "CRR-TEST-001",
    "1.0.0",
  );

  assert.equal(resolved.evidenceLevel, "GUIDELINE");
  assert.equal(resolved.completeness, "COMPLETE");
  assert.equal(resolved.sources.length, 1);
});

test("repository returns safe unspecified package when missing", () => {
  const repository = new RuleEvidenceRepository();

  const resolved = repository.resolve(
    "UNKNOWN-RULE",
    "1.0.0",
  );

  assert.equal(resolved.evidenceLevel, "UNSPECIFIED");
  assert.equal(resolved.completeness, "MISSING");
  assert.equal(resolved.sources.length, 0);
});

test("evidence engine enriches trace without changing identity", () => {
  const repository = new RuleEvidenceRepository();
  repository.registerSource(source());
  repository.registerBinding(binding());

  const engine = new RuleEvidenceEngine({ repository });
  const trace = Object.freeze({
    ruleId: "CRR-TEST-001",
    ruleVersion: "1.0.0",
    matched: true,
  });

  const enriched = engine.enrichTrace(trace);

  assert.equal(enriched.ruleId, trace.ruleId);
  assert.equal(enriched.evidence.level, "GUIDELINE");
  assert.equal(enriched.evidence.sourceCount, 1);
});

test("coverage report measures complete and unspecified rules", () => {
  const repository = new RuleEvidenceRepository();
  repository.registerSource(source());
  repository.registerBinding(binding());

  const report = repository.coverageForRules([
    { id: "CRR-TEST-001", version: "1.0.0" },
    { id: "CRR-TEST-002", version: "1.0.0" },
  ]);

  assert.equal(report.totalRules, 2);
  assert.equal(report.complete, 1);
  assert.equal(report.unspecified, 1);
  assert.equal(report.coveragePercent, 50);
});

test("baseline library creates unspecified bindings without inference", () => {
  const clinical = createClinicalRuleLibrary();

  const evidence = createRuleEvidenceLibrary({
    rules: clinical.rules,
  });

  assert.equal(
    evidence.coverage.totalRules,
    clinical.summary.total,
  );
  assert.equal(evidence.coverage.complete, 0);
  assert.equal(
    evidence.coverage.unspecified,
    clinical.summary.total,
  );
  assert.ok(
    evidence.bindings.every(
      (item) =>
        item.evidenceLevel === "UNSPECIFIED" &&
        item.metadata.migrationMode ===
          "NO_SCIENTIFIC_INFERENCE",
    ),
  );
});

test("evidence source keeps only structured citation metadata", () => {
  const value = source({
    authors: ["Author A", "Author A", "Author B"],
    doi: "10.1234/test.2026.1",
    pmid: "12345678",
    url: "https://example.org/evidence",
  });

  assert.deepEqual(value.authors, [
    "Author A",
    "Author B",
  ]);
  assert.equal(value.doi, "10.1234/test.2026.1");
  assert.equal(value.pmid, "12345678");
});
