import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evaluateMarrowFocalBlastoidTerminalAuthority,
  applyMarrowFocalBlastoidTerminalAuthority,
  MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
  MARROW_FOCAL_BLASTOID_LEGACY_NON_REPROMOTION_VERSION,
  MARROW_FOCAL_BLASTOID_MONOTONIC_SCOPE_VERSION,
  MARROW_FOCAL_BLASTOID_TERMINAL_PRESENTATION_POLICY_VERSION,
} from "../ai/boneMarrow/marrowFocalBlastoidTerminalAuthorityEngine.js";
import { analyzeGlobalPattern } from "../ai/globalPatternEngine.js";
import { evaluateMarrowDominantPatternState } from "../ai/boneMarrow/marrowDominantPatternStateReconciliationEngine.js";
import { evaluateMarrowPositiveBlastEvidenceSemanticSupersession } from "../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";
import { applyFinalMarrowAuthority } from "../ai/boneMarrow/marrowFinalClinicalAuthorityEngine.js";
import { applyMarrowMorphologyAdequacyProjectionLock } from "../ai/boneMarrow/marrowMorphologyAdequacyProjectionLockEngine.js";
import { buildCanonicalClinicalPresentation } from "../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js";

function focalLmaLike() {
  return {
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    rawResponse: {
      blastAssessment: {
        evidenceState: "FOCAL_SUSPICION",
        approximateBlastLikeCells: 2,
      },
    },
    blastAssessment: {
      evidenceState: "FOCAL_SUSPICION",
      approximateBlastLikeCells: 2,
    },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      active: true,
      priorEvidenceState: "FOCAL_SUSPICION",
      cellLevelPositiveCytology: true,
    },
    marrowPositiveCellLevelBlastoidScopeLock: {
      version: "BE-FIX-005.50.19",
      active: true,
      originEvidenceState: "FOCAL_SUSPICION",
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceForbidden: true,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
    },
    evidenceGovernance: {
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      cellLevelPositiveBlastoidCytology: true,
    },
    findings: {
      immatureCells: true,
      blastSuspicion: true,
      blastEvidenceState: "FOCAL_SUSPICION",
      cellLevelPositiveBlastoidCytology: true,
    },
    marrowRecoveredCytologyProjection: {
      evidenceState: "FOCAL_SUSPICION",
      structuredPositive: true,
      architectureQualified: true,
      repeatedPattern: true,
      coherentSubset: true,
      distinctFromMaturationContinuum: true,
    },
    marrowPositiveBlastEvidenceLock: {
      active: true,
      positiveEvidencePreserved: true,
      coherentSubset: true,
    },
    marrowBlastPopulationEvidence: {
      evidenceState: "FOCAL_SUSPICION",
      suspiciousPopulation: true,
      observedPopulation: false,
      positive: true,
      focalSuspicion: true,
    },
    marrowMyeloidExpansionDiscrimination: {
      structuredPathologicSubset: false,
      populationInferenceAllowed: false,
      blastArchitecture: {
        structuredPathologicSubset: false,
        architectureScore: 3,
      },
    },
    marrowPrecursorDiscrimination: {
      coherentBlastoidSubpopulation: false,
      strongBlastoidPattern: false,
    },
    globalPattern: {
      dominantPattern: "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
      marrowPositiveBlastEvidence: true,
      marrowPopulationBlastEvidence: true,
    },
    patternRecognition: { overallPattern: "MARROW_BLASTOID_POPULATION_SUSPICIOUS" },
    overallAssessment: { requiresHumanReview: true, riskCategory: "MARROW_BLASTOID_POPULATION_SUSPICIOUS" },
    structuredReport: {},
    morphologyAnalysis: {},
    clinicalResultV2: {
      scope: { limitedField: true },
      criticalFindings: { blastLike: { state: "SUSPICIOUS_INDETERMINATE", evidence: ["focal blastoid"] } },
      presentation: { clinicalCriticality: { level: "HIGH" } },
      risk: { severity: "HIGH" },
      review: { required: true },
      provenance: { craVersion: "CRA-001.1" },
    },
  };
}

test("PASS 0 — 005.50.21 fingerprints are registered", () => {
  assert.equal(MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION, "BE-FIX-005.50.21");
  assert.equal(MARROW_FOCAL_BLASTOID_LEGACY_NON_REPROMOTION_VERSION, "BE-FIX-005.50.21");
  assert.equal(MARROW_FOCAL_BLASTOID_MONOTONIC_SCOPE_VERSION, "BE-FIX-005.50.21");
  assert.equal(MARROW_FOCAL_BLASTOID_TERMINAL_PRESENTATION_POLICY_VERSION, "BE-FIX-005.50.21");
});

test("PASS 1 — focal positive cell-level cytology establishes terminal scope authority", () => {
  const d = evaluateMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  assert.equal(d.active, true);
  assert.equal(d.populationInferenceAllowed, false);
  assert.equal(d.populationPositiveAllowed, false);
  assert.equal(d.blastPercentageInferenceAllowed, false);
});

test("PASS 2 — terminal authority revokes stale derived population semantics but preserves focal positivity", () => {
  const out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(out.findings.cellLevelPositiveBlastoidCytology, true);
  assert.equal(out.finalClassification, "MARROW_BLASTOID_FOCAL_SUSPICION");
  assert.equal(out.globalPattern.dominantPattern, "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN");
  assert.equal(out.globalPattern.marrowPopulationBlastEvidence, false);
});

test("PASS 3 — 005.42 cannot reconstruct a structured population after terminal focal authority", () => {
  const out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  const state = evaluateMarrowDominantPatternState(out);
  assert.equal(state.structuredBlastPopulation, false);
});

test("PASS 4 — 005.44 cannot re-enable population positivity after terminal focal authority", () => {
  const out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  const d = evaluateMarrowPositiveBlastEvidenceSemanticSupersession(out);
  assert.equal(d.populationInferenceAllowed, false);
  assert.equal(d.populationPositiveAllowed, false);
});

test("PASS 5 — Global Pattern consumes terminal focal scope monotonically", () => {
  const out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  const gp = analyzeGlobalPattern(out);
  assert.equal(gp.dominantPattern, "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN");
  assert.equal(gp.marrowPositiveBlastoidCytology, true);
  assert.equal(gp.marrowPopulationBlastEvidence, false);
  assert.equal(gp.populationPositiveAllowed, false);
});

test("PASS 6 — 005.46 final authority cannot resurrect suspicious population", () => {
  let out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  out = applyFinalMarrowAuthority(out);
  assert.notEqual(out.finalClassification, "MARROW_BLASTOID_POPULATION_SUSPICIOUS");
  assert.equal(out.finalMarrowAuthority.structuredBlast.populationPositiveAllowed, false);
});

test("PASS 7 — 005.47 preserves focal morphology and population prohibition", () => {
  let out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  out = applyMarrowMorphologyAdequacyProjectionLock(out);
  assert.equal(out.finalClassification, "MARROW_BLASTOID_FOCAL_SUSPICION");
  assert.equal(out.evidenceGovernance.populationPositiveAllowed, false);
  assert.equal(out.evidenceGovernance.blastPercentageInferenceAllowed, false);
});

test("PASS 8 — canonical presentation cannot flip false scope permissions to true", () => {
  const out = applyMarrowFocalBlastoidTerminalAuthority(focalLmaLike());
  const p = buildCanonicalClinicalPresentation(out);
  assert.equal(p.presentationPolicy.focalBlastoidFindingDoesNotEstablishPopulation, true);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, false);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, false);
});

test("PASS 9 — independent OBSERVED_POPULATION remains protected", () => {
  const x = focalLmaLike();
  x.rawResponse.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  x.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  x.marrowTrueAmlPositiveCytomorphologyRecovery.priorEvidenceState = "OBSERVED_POPULATION";
  x.marrowBlastPopulationEvidence = {
    evidenceState: "OBSERVED_POPULATION",
    observedPopulation: true,
    suspiciousPopulation: false,
  };
  const d = evaluateMarrowFocalBlastoidTerminalAuthority(x);
  assert.equal(d.active, false);
  assert.equal(d.trueObservedPopulationProtected, true);
});

test("PASS 10 — independent SUSPICIOUS_POPULATION remains protected", () => {
  const x = focalLmaLike();
  x.rawResponse.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  x.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  x.marrowTrueAmlPositiveCytomorphologyRecovery.priorEvidenceState = "SUSPICIOUS_POPULATION";
  x.marrowPositiveCellLevelBlastoidScopeLock.originEvidenceState = "SUSPICIOUS_POPULATION";
  const d = evaluateMarrowFocalBlastoidTerminalAuthority(x);
  assert.equal(d.active, false);
  assert.equal(d.preExistingSuspiciousPopulationProtected, true);
});

test("PASS 11 — server integrates 005.50.21 before global pattern, late marrow writers and canonical presentation", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION/);
  assert.match(server, /applyMarrowFocalBlastoidTerminalAuthority\(mergedAnalysis\)/);
  assert.match(server, /applyMarrowFocalBlastoidTerminalAuthority\(finalResult\)/);
  assert.match(server, /marrowFocalBlastoidScopeTerminalAuthorityVersion/);
});
