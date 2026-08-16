import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  evaluateMarrowMyeloproliferativePatternCriticality,
  applyMarrowMyeloproliferativePatternCriticality,
  MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION,
  MARROW_TERMINAL_CRITICALITY_CORE_SIGNATURE_VERSION,
} from "../ai/boneMarrow/marrowMyeloproliferativePatternCriticalityEngine.js";
import { buildCanonicalClinicalTruth } from "../ai/clinicalResultV2/canonicalClinicalTruthBuilder.js";

function lmcLikeCase() {
  return {
    finalClassification: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    morphologicRiskClass: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    finalMarrowAuthority: {
      protectedExpansion: true,
      structuredBlast: { observed: false, suspicious: false, structured: false },
    },
    marrowPathologicMaturationContinuumLock: { active: true },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      expansionScore: 8,
      disproportionateAxis: true,
      expansionBurdenAxis: true,
      maturationAxis: true,
      expansionSignals: {
        relativeMyeloidPredominance: true,
        disproportionateMyeloidRepresentation: true,
        numerousGranulocyticPrecursors: true,
        broadMaturationSpectrum: true,
        matureFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
        erythroidRelativeReduction: false,
        basophilEosinophilEnrichment: false,
        denseMyeloidField: true,
      },
    },
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
    confidenceAnalysis: {
      globalConfidenceScore: 58,
      confidenceHierarchy: { diagnosticLevel: 20, global: 58 },
      hematologicRisk: { level: "moderate", score: 45 },
    },
    overallAssessment: {},
    structuredReport: {},
  };
}

test("PASS 0 — 005.50.1 compatibility and 005.50.2 identity are registered", () => {
  assert.equal(MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION, "BE-FIX-005.50.1");
  assert.equal(MARROW_TERMINAL_CRITICALITY_CORE_SIGNATURE_VERSION, "BE-FIX-005.50.2");
});

test("PASS 1 — 83-like high-salience core signature becomes CRITICAL without optional modifiers", () => {
  const decision = evaluateMarrowMyeloproliferativePatternCriticality(lmcLikeCase());
  assert.equal(decision.highSalienceCriticalSignature, true);
  assert.equal(decision.severityLevel, "CRITICAL");
  assert.equal(decision.highSalienceSupportiveModifiers, 0);
});

test("PASS 2 — limited field does not downgrade critical morphology", () => {
  const result = applyMarrowMyeloproliferativePatternCriticality(lmcLikeCase());
  assert.equal(result.clinicalCriticality.level, "CRITICAL");
  assert.equal(result.clinicalCriticality.adequacyIndependent, true);
  assert.equal(result.confidenceAnalysis.confidenceHierarchy.diagnosticLevel, 20);
});

test("PASS 3 — CRA consumes terminal criticality", () => {
  const result = applyMarrowMyeloproliferativePatternCriticality(lmcLikeCase());
  const truth = buildCanonicalClinicalTruth(result, {
    specimenType: "BONE_MARROW_ASPIRATE",
    analysisSource: "ai_visual",
  });
  assert.equal(truth.risk.severity, "CRITICAL");
});

test("PASS 4 — polychromasia is positive RBC morphology in limited field", () => {
  const truth = buildCanonicalClinicalTruth({
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
    localMorphologyEvidence: {
      erythrocytes: {
        description: "Hemácias avaliáveis no campo, com policromasia visível.",
        chromia: "Policromasia presente.",
        positiveFindings: [
          "Hemácias azuladas/acinzentadas compatíveis com policromasia.",
        ],
      },
    },
    morphologyAnalysis: {
      erythrocyteReview: "Policromasia presente no campo analisado.",
    },
    confidenceAnalysis: { globalConfidenceScore: 60 },
  });

  assert.equal(truth.lineages.erythrocytes.positiveMorphology.polychromasia, true);
  assert.equal(truth.lineages.erythrocytes.assessment.state, "OBSERVED");
  assert.equal(
    truth.lineages.erythrocytes.positiveMorphology.globalExclusionAllowed,
    false,
  );
});

test("PASS 5 — generic limited field does not fabricate criticality or polychromasia", () => {
  const truth = buildCanonicalClinicalTruth({
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
    confidenceAnalysis: { globalConfidenceScore: 55 },
  });
  assert.notEqual(truth.risk.severity, "CRITICAL");
  assert.equal(truth.lineages.erythrocytes.positiveMorphology.polychromasia, false);
});

test("PASS 6 — server exposes post-CRA terminal authority and preserves 005.50.1 prompt invariant", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /PRESERVAÇÃO DE MORFOLOGIA ERITROCITÁRIA POSITIVA EM CAMPO LIMITADO/);
  assert.match(server, /terminalClinicalCriticalityAuthorityVersion/);
  assert.match(server, /canonicalNarrativeAuthorityVersion/);
  assert.match(server, /positiveRbcMorphologyPreservationVersion/);
  assert.match(server, /BE-FIX-005\.50\.2 — TERMINAL CLINICAL CRITICALITY AUTHORITY/);
});
