import test from "node:test";
import assert from "node:assert/strict";

import analyzeGlobalPattern, {
  MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION,
  MARROW_FOCAL_BLASTOID_GLOBAL_PATTERN_SEMANTIC_COHERENCE_VERSION,
  MARROW_FOCAL_BLASTOID_POPULATION_SEMANTIC_NON_PROMOTION_VERSION,
} from "../ai/globalPatternEngine.js";

function focalCase() {
  return {
    findings: {
      blastSuspicion: true,
      immatureCells: true,
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
    },
    evidenceGovernance: {
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      cellLevelPositiveBlastoidCytology: true,
    },
    marrowPositiveCellLevelBlastoidScopeLock: {
      active: true,
      originEvidenceState: "FOCAL_SUSPICION",
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceForbidden: true,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
    },
    marrowBlastPopulationEvidence: {
      evidenceState: "FOCAL_SUSPICION",
      focalSuspicion: true,
      suspiciousPopulation: false,
      observedPopulation: false,
      positive: false,
    },
  };
}

test("PASS 0 — 005.50.20 fingerprints are registered", () => {
  assert.equal(
    MARROW_FOCAL_BLASTOID_SCOPE_GLOBAL_PATTERN_PROPAGATION_VERSION,
    "BE-FIX-005.50.20",
  );
  assert.equal(
    MARROW_FOCAL_BLASTOID_GLOBAL_PATTERN_SEMANTIC_COHERENCE_VERSION,
    "BE-FIX-005.50.20",
  );
  assert.equal(
    MARROW_FOCAL_BLASTOID_POPULATION_SEMANTIC_NON_PROMOTION_VERSION,
    "BE-FIX-005.50.20",
  );
});

test("PASS 1 — focal positive scope propagates into Global Pattern", () => {
  const out = analyzeGlobalPattern(focalCase());
  assert.equal(
    out.dominantPattern,
    "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN",
  );
  assert.equal(out.marrowPositiveBlastoidCytology, true);
  assert.equal(out.marrowPopulationBlastEvidence, false);
});

test("PASS 2 — population and blast percentage inference remain forbidden", () => {
  const out = analyzeGlobalPattern(focalCase());
  assert.equal(out.populationInferenceAllowed, false);
  assert.equal(out.populationPositiveAllowed, false);
  assert.equal(out.blastPercentageInferenceAllowed, false);
  assert.equal(out.focalBlastoidFindingDoesNotEstablishPopulation, true);
});

test("PASS 3 — stale derived population flags cannot re-promote focal cytology", () => {
  const input = focalCase();
  input.marrowBlastPopulationEvidence.suspiciousPopulation = true;
  input.marrowBlastPopulationEvidence.positive = true;

  const out = analyzeGlobalPattern(input);

  assert.notEqual(
    out.dominantPattern,
    "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
  );
  assert.equal(out.marrowPopulationBlastEvidence, false);
});

test("PASS 4 — focal positive cytology cannot collapse to physiologic/unremarkable", () => {
  const out = analyzeGlobalPattern(focalCase());
  assert.equal(out.physiologicAppearance, false);
  assert.equal(out.normalityBlocked, true);
  assert.equal(
    out.blastAssessmentState,
    "FOCAL_POSITIVE_CYTOLOGY_POPULATION_NOT_ESTABLISHED",
  );
});

test("PASS 5 — true OBSERVED_POPULATION remains protected", () => {
  const input = focalCase();
  input.marrowPositiveCellLevelBlastoidScopeLock.active = false;
  input.evidenceGovernance.populationInferenceAllowed = true;
  input.evidenceGovernance.populationPositiveAllowed = true;
  input.marrowBlastPopulationEvidence = {
    evidenceState: "OBSERVED_POPULATION",
    observedPopulation: true,
    suspiciousPopulation: false,
    positive: true,
  };

  const out = analyzeGlobalPattern(input);

  assert.equal(
    out.dominantPattern,
    "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
  );
  assert.equal(out.marrowPopulationBlastEvidence, true);
});
