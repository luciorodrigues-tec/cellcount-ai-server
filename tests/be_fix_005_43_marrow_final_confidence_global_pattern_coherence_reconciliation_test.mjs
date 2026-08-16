import test from "node:test";
import assert from "node:assert/strict";

import {
  buildConfidenceAnalysis,
  MARROW_FINAL_CONFIDENCE_RECONCILIATION_VERSION,
} from "../ai/confidenceEngine.js";

import analyzeGlobalPattern, {
  MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
} from "../ai/globalPatternEngine.js";

function protectedExpansionCase(overrides = {}) {
  return {
    finalClassification: "CLASS_1_LIMITED_FIELD",
    morphologicRiskClass: "CLASS_1_LIMITED_FIELD",
    normalityBlocked: true,
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
    },
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      monomorphicPopulation: false,
      atypicalLymphocytes: false,
      largeMononuclearCells: false,
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      structuredPathologicSubset: false,
    },
    marrowDominantPatternStateReconciliation: {
      version: "BE-FIX-005.42",
      active: true,
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionProtected: true,
    },
    localMorphologyEvidence: {
      marrow: {
        blastPopulationEvidence: {
          precursorDiscrimination: {
            classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
            pathologicMyeloidExpansionProtected: true,
            blastoidSubpopulationSignals: {
              distinctFromMaturationContinuum: false,
              morphologicallyCoherent: false,
              repeatedAcrossField: false,
              structuredPathologicSubset: false,
            },
          },
        },
      },
    },
    morphologyAnalysis: {
      overview:
        "Campo medular com expansão mieloide/granulocítica e amplo espectro maturativo.",
    },
    ...overrides,
  };
}

test("PASS 0 — 005.43 identities are registered", () => {
  assert.equal(
    MARROW_FINAL_CONFIDENCE_RECONCILIATION_VERSION,
    "BE-FIX-005.43",
  );
  assert.equal(
    MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION,
    "BE-FIX-005.43",
  );
});

test("PASS 1 — protected marrow expansion cannot collapse to GLOBAL_UNREMARKABLE_PATTERN", () => {
  const result = analyzeGlobalPattern(protectedExpansionCase());
  assert.equal(
    result.dominantPattern,
    "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
  );
  assert.equal(result.pathologicMyeloidExpansionPattern, true);
});

test("PASS 2 — limited field preserves morphology-pattern confidence", () => {
  const confidence = buildConfidenceAnalysis({
    analysis: protectedExpansionCase(),
  });

  assert.ok(confidence.globalConfidenceScore >= 50);
  assert.ok(confidence.confidenceHierarchy.morphologyLevel >= 55);
  assert.ok(confidence.safetySignals.morphologyCoherence >= 55);
});

test("PASS 3 — diagnostic confidence remains conservative", () => {
  const confidence = buildConfidenceAnalysis({
    analysis: protectedExpansionCase(),
  });

  assert.ok(confidence.confidenceHierarchy.diagnosticLevel <= 30);
  assert.equal(confidence.safetySignals.safeDiagnosticGate, false);
});

test("PASS 4 — protected expansion is not labeled morphologically indeterminate", () => {
  const confidence = buildConfidenceAnalysis({
    analysis: protectedExpansionCase(),
  });

  assert.notEqual(
    confidence.hematologicRisk.label,
    "CLASSIFICAÇÃO MORFOLÓGICA INDETERMINADA",
  );
  assert.match(confidence.hematologicRisk.label, /EXPANSÃO MIELOIDE/i);
});

test("PASS 5 — generic limited field without protected expansion remains conservative", () => {
  const base = protectedExpansionCase();
  delete base.marrowMyeloidExpansionDiscrimination;
  delete base.marrowDominantPatternStateReconciliation;
  base.localMorphologyEvidence = {};

  const confidence = buildConfidenceAnalysis({ analysis: base });

  assert.equal(confidence.globalConfidenceScore, 35);
  assert.equal(
    confidence.hematologicRisk.label,
    "CLASSIFICAÇÃO MORFOLÓGICA INDETERMINADA",
  );
});

test("PASS 6 — true structured blastoid architecture outranks 005.43 expansion confidence reconciliation", () => {
  const caseData = protectedExpansionCase();
  caseData.localMorphologyEvidence.marrow.blastPopulationEvidence.precursorDiscrimination
    .blastoidSubpopulationSignals = {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedAcrossField: true,
      structuredPathologicSubset: true,
    };

  const global = analyzeGlobalPattern({
    ...caseData,
    marrowPositiveBlastEvidenceLock: { active: true },
  });

  assert.equal(global.dominantPattern, "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN");
});

test("PASS 7 — 005.43 remains morphology-only and never emits CML/BCR::ABL1 diagnosis", () => {
  const confidence = buildConfidenceAnalysis({
    analysis: protectedExpansionCase(),
  });
  const global = analyzeGlobalPattern(protectedExpansionCase());
  const text = JSON.stringify({ confidence, global }).toUpperCase();

  assert.equal(text.includes("BCR::ABL1"), false);
  assert.equal(text.includes("LEUCEMIA MIELOIDE CRÔNICA"), false);
  assert.equal(text.includes('"CML"'), false);
});

test("PASS 8 — 005.43 metadata is exposed in confidence and global pattern", () => {
  const confidence = buildConfidenceAnalysis({
    analysis: protectedExpansionCase(),
  });
  const global = analyzeGlobalPattern(protectedExpansionCase());

  assert.equal(
    confidence.calibration.marrowFinalConfidenceReconciliationVersion,
    "BE-FIX-005.43",
  );
  assert.equal(
    global.marrowGlobalPatternCoherenceReconciliationVersion,
    "BE-FIX-005.43",
  );
});

test("PASS 9 — server exposes 005.43 runtime fingerprints", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /marrowFinalConfidenceReconciliationVersion/);
  assert.match(server, /MARROW_FINAL_CONFIDENCE_RECONCILIATION_VERSION/);
  assert.match(server, /marrowFinalGlobalPatternCoherenceVersion/);
  assert.match(server, /MARROW_GLOBAL_PATTERN_COHERENCE_RECONCILIATION_VERSION/);
});
