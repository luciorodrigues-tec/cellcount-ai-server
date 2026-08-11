import test from "node:test";
import assert from "node:assert/strict";
import {
  applyFieldScopedNegativeFindings,
} from "../ai/fieldScopedNegativeFindings.js";

function baseResult() {
  return {
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: true,
      criticalMorphology: {
        blastLikeMorphology: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        auerRods: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        parasites: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        schistocytes: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
        plateletAggregates: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
      },
    },
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    findings: {},
    morphologyAnalysis: {},
    whatAISees: {},
  };
}

test("PASS 0 — BE-FIX-005.5.3 per-item field-scope qualifier remains intact", () => {
  const result = applyFieldScopedNegativeFindings(baseResult());
  assert.ok(result.negativeFindingsStructured.length > 0);
  for (const item of result.negativeFindingsStructured) {
    assert.match(item, /não permite exclusão global na lâmina/i);
  }
});

test("PASS 1 — one canonical presentation-level global qualifier is exposed", () => {
  const result = applyFieldScopedNegativeFindings(baseResult());
  assert.match(
    result.negativeFindingScope.globalQualifier,
    /não permite excluir sua presença em outras áreas da lâmina/i,
  );
});

test("PASS 2 — field scope still forbids global negative exclusion", () => {
  const result = applyFieldScopedNegativeFindings(baseResult());
  assert.equal(result.negativeFindingScope.globalNegativeExclusionAllowed, false);
});
