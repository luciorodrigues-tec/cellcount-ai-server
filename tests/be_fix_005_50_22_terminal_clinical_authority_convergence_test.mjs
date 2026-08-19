import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import analyzeGlobalPattern, {
  MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
  MARROW_TERMINAL_GLOBAL_PATTERN_RECOMPUTATION_VERSION,
} from "../ai/globalPatternEngine.js";

import {
  buildCanonicalClinicalPresentation,
  CANONICAL_CLINICAL_PRESENTATION_GATE_INHERITANCE_VERSION,
  CANONICAL_CLINICAL_PRESENTATION_LAST_WRITER_VERSION,
} from "../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js";

function v2(state = "SUSPICIOUS_INDETERMINATE") {
  return {
    criticalFindings: {
      blastLike: {
        state,
        evidence: ["Citomorfologia blastoide focal positiva."],
      },
    },
    presentation: {},
    risk: { severity: "HIGH" },
    review: { required: true },
    scope: { limitedField: true },
    provenance: { craVersion: "CRA-001.1" },
    lineages: { erythrocytes: { positiveMorphology: {} } },
  };
}

function focalRecoveryCase() {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    clinicalResultV2: v2(),
    findings: {
      blastSuspicion: true,
      immatureCells: true,
      blastEvidenceState: "FOCAL_SUSPICION",
      cellLevelPositiveBlastoidCytology: true,
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
    rawResponse: {
      blastAssessment: {
        evidenceState: "FOCAL_SUSPICION",
      },
    },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      version: "BE-FIX-005.50.18",
      active: true,
      directCellLevelPositive: true,
      cellLevelPositiveCytology: true,
      recoveredEvidenceState: "FOCAL_SUSPICION",
      preExistingArchitectureQualified: false,
      populationPositiveFabricated: false,
      populationPromotionAllowedByThisEngine: false,
    },
    // Simulate late-writer pollution: projected container was re-promoted.
    marrowBlastPopulationEvidence: {
      evidenceState: "FOCAL_SUSPICION",
      suspiciousPopulation: true,
      positive: true,
    },
    marrowPositiveCellLevelBlastoidScopeLock: {
      version: "BE-FIX-005.50.19",
      active: false,
      cellLevelPositiveBlastoidCytology: false,
      populationInferenceForbidden: true,
    },
    marrowFocalBlastoidTerminalAuthority: {
      version: "BE-FIX-005.50.21",
      active: false,
      cellLevelPositiveBlastoidCytology: false,
      populationInferenceForbidden: true,
    },
    morphologyAnalysis: {},
  };
}

test("PASS 0 — 005.50.22 fingerprints are registered", () => {
  assert.equal(
    MARROW_TERMINAL_CLINICAL_AUTHORITY_CONVERGENCE_VERSION,
    "BE-FIX-005.50.22",
  );
  assert.equal(
    MARROW_TERMINAL_GLOBAL_PATTERN_RECOMPUTATION_VERSION,
    "BE-FIX-005.50.22",
  );
  assert.equal(
    CANONICAL_CLINICAL_PRESENTATION_GATE_INHERITANCE_VERSION,
    "BE-FIX-005.50.22",
  );
  assert.equal(
    CANONICAL_CLINICAL_PRESENTATION_LAST_WRITER_VERSION,
    "BE-FIX-005.50.22",
  );
});

test("PASS 1 — trusted 005.50.18 focal recovery survives lost 005.50.19/21 containers", () => {
  const out = analyzeGlobalPattern(focalRecoveryCase());
  assert.equal(
    out.dominantPattern,
    "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN",
  );
  assert.equal(out.marrowPositiveBlastoidCytology, true);
  assert.equal(out.marrowPopulationBlastEvidence, false);
  assert.equal(out.populationInferenceAllowed, false);
  assert.equal(out.populationPositiveAllowed, false);
  assert.equal(out.blastPercentageInferenceAllowed, false);
});

test("PASS 2 — stale projected suspiciousPopulation cannot defeat trusted focal recovery", () => {
  const out = analyzeGlobalPattern(focalRecoveryCase());
  assert.notEqual(
    out.dominantPattern,
    "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
  );
  assert.equal(out.focalBlastoidScopeAuthority.active, true);
  assert.equal(
    out.focalBlastoidScopeAuthority.source,
    "BE-FIX-005.50.18_TRUSTED_CELL_LEVEL_RECOVERY",
  );
});

test("PASS 3 — canonical presentation inherits focal false gates", () => {
  const input = focalRecoveryCase();
  input.globalPattern = analyzeGlobalPattern(input);
  const p = buildCanonicalClinicalPresentation(input);
  assert.equal(
    p.presentationPolicy.focalBlastoidFindingDoesNotEstablishPopulation,
    true,
  );
  assert.equal(p.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, false);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, false);
  assert.equal(p.presentationPolicy.cellLevelPositiveBlastoidCytology, true);
});

test("PASS 4 — absence of focality does not manufacture marrow population permission", () => {
  const input = {
    specimenType: "BONE_MARROW_ASPIRATE",
    clinicalResultV2: v2("NOT_OBSERVED"),
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
    },
    marrowBlastPopulationEvidence: {
      evidenceState: "NOT_ASSESSABLE",
      observedPopulation: false,
      suspiciousPopulation: false,
    },
  };
  const p = buildCanonicalClinicalPresentation(input);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, false);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, false);
});

test("PASS 5 — independent OBSERVED_POPULATION remains protected", () => {
  const input = focalRecoveryCase();
  input.rawResponse.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  input.marrowBlastPopulationEvidence = {
    evidenceState: "OBSERVED_POPULATION",
    observedPopulation: true,
    suspiciousPopulation: false,
  };
  const out = analyzeGlobalPattern(input);
  assert.equal(
    out.dominantPattern,
    "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
  );
  assert.equal(out.marrowPopulationBlastEvidence, true);
});

test("PASS 6 — independent SUSPICIOUS_POPULATION remains protected", () => {
  const input = focalRecoveryCase();
  input.rawResponse.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  input.marrowBlastPopulationEvidence = {
    evidenceState: "SUSPICIOUS_POPULATION",
    observedPopulation: false,
    suspiciousPopulation: true,
  };
  const out = analyzeGlobalPattern(input);
  assert.equal(
    out.dominantPattern,
    "MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN",
  );
  assert.equal(out.marrowPopulationBlastEvidence, true);
});

test("PASS 7 — canonical presentation allows population gates only for qualified population evidence", () => {
  const input = focalRecoveryCase();
  input.rawResponse.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  input.marrowBlastPopulationEvidence = {
    evidenceState: "OBSERVED_POPULATION",
    observedPopulation: true,
  };
  input.evidenceGovernance = {
    populationInferenceAllowed: true,
    populationPositiveAllowed: true,
    blastPercentageInferenceAllowed: true,
  };
  const p = buildCanonicalClinicalPresentation(input);
  assert.equal(p.presentationPolicy.populationEvidenceEstablished, true);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, true);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, true);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, true);
});

test("PASS 8 — canonical presentation is the last clinical writer in server terminal block", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  const marker = source.indexOf(
    "BE-FIX-005.50.22 — TERMINAL CLINICAL AUTHORITY CONVERGENCE",
  );
  assert.ok(marker >= 0);

  const terminal = source.slice(marker);
  const canonicalCall = terminal.lastIndexOf(
    "applyCanonicalClinicalPresentationAuthority",
  );
  const focalAuthorityCall = terminal.lastIndexOf(
    "applyMarrowFocalBlastoidTerminalAuthority",
  );
  const scopeLockCall = terminal.lastIndexOf(
    "applyMarrowPositiveCellLevelBlastoidScopeLock",
  );
  const unresolvedCall = terminal.lastIndexOf(
    "applyMarrowUnresolvedImmaturityFinalStateCoherence",
  );

  assert.ok(canonicalCall > focalAuthorityCall);
  assert.ok(canonicalCall > scopeLockCall);
  assert.ok(canonicalCall > unresolvedCall);
});

test("PASS 9 — server exposes 005.50.22 runtime fingerprints", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  for (const key of [
    "marrowTerminalClinicalAuthorityConvergenceVersion",
    "marrowTerminalGlobalPatternRecomputationVersion",
    "canonicalClinicalPresentationGateInheritanceVersion",
    "canonicalClinicalPresentationLastWriterVersion",
  ]) {
    assert.ok(source.includes(key), `missing runtime key: ${key}`);
  }
});
