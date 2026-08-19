import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  applyMarrowFocalBlastoidAuthorityProvenance,
  evaluateMarrowFocalBlastoidAuthorityProvenance,
  MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION,
} from "../ai/boneMarrow/marrowFocalBlastoidAuthorityProvenanceEngine.js";
import {
  applyMarrowPositiveCellLevelBlastoidScopeLock,
} from "../ai/boneMarrow/marrowPositiveCellLevelBlastoidScopeLockEngine.js";
import {
  applyMarrowFocalBlastoidTerminalAuthority,
} from "../ai/boneMarrow/marrowFocalBlastoidTerminalAuthorityEngine.js";
import analyzeGlobalPattern from "../ai/globalPatternEngine.js";
import {
  buildCanonicalClinicalPresentation,
} from "../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js";
import {
  enforceBoneMarrowOutputContract,
  MARROW_CONTEXT_AWARE_NARRATIVE_SANITIZATION_VERSION,
} from "../ai/boneMarrow/boneMarrowOutputContract.js";

function v2() {
  return {
    criticalFindings: {
      blastLike: {
        state: "SUSPICIOUS_INDETERMINATE",
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

function focalRaw() {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    blastAssessment: { evidenceState: "FOCAL_SUSPICION" },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      version: "BE-FIX-005.50.18",
      active: true,
      directCellLevelPositive: true,
      cellLevelPositiveCytology: true,
      independentlyBlastoidCellCount: 2,
      priorEvidenceState: "FOCAL_SUSPICION",
      recoveredEvidenceState: "FOCAL_SUSPICION",
      preExistingArchitectureQualified: false,
      populationPositiveFabricated: false,
      populationPromotionAllowedByThisEngine: false,
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
    },
  };
}

function normalizedLossCase() {
  const raw = applyMarrowFocalBlastoidAuthorityProvenance(focalRaw());
  // Simulate normalizeMedicalResponse: only rawResponse survives; late writers
  // add false population architecture afterwards.
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    clinicalResultV2: v2(),
    rawResponse: raw,
    findings: {
      immatureCells: true,
      blastSuspicion: false,
      blastEvidenceState: "SUSPICIOUS_INDETERMINATE",
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
    },
    evidenceGovernance: {},
    marrowBlastPopulationEvidence: {
      evidenceState: "FOCAL_SUSPICION",
      observedPopulation: false,
      suspiciousPopulation: true,
      positive: true,
    },
    finalMarrowAuthority: {
      structuredBlast: {
        observed: false,
        suspicious: true,
        structured: true,
        evidenceState: "FOCAL_SUSPICION",
        populationInferenceAllowed: false,
        populationPositiveAllowed: true,
      },
    },
  };
}

test("PASS 0 — 005.50.23 fingerprints are registered", () => {
  assert.equal(MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION, "BE-FIX-005.50.23");
  assert.equal(MARROW_CONTEXT_AWARE_NARRATIVE_SANITIZATION_VERSION, "BE-FIX-005.50.23");
});

test("PASS 1 — trusted 005.50.18 focal cytology creates monotonic provenance", () => {
  const out = applyMarrowFocalBlastoidAuthorityProvenance(focalRaw());
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.locked, true);
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.focalCellLevelPositive, true);
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.populationPositiveAllowed, false);
});

test("PASS 2 — provenance survives legacy normalization through rawResponse", () => {
  const input = normalizedLossCase();
  const out = applyMarrowFocalBlastoidAuthorityProvenance(input);
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.locked, true);
  assert.equal(out.findings.cellLevelPositiveBlastoidCytology, true);
  assert.equal(out.evidenceGovernance.populationInferenceAllowed, false);
});

test("PASS 3 — 005.50.19 consumes recovered provenance after top-level recovery loss", () => {
  let out = applyMarrowFocalBlastoidAuthorityProvenance(normalizedLossCase());
  out = applyMarrowPositiveCellLevelBlastoidScopeLock(out);
  assert.equal(out.marrowPositiveCellLevelBlastoidScopeLock.active, true);
  assert.equal(out.marrowBlastPopulationEvidence.suspiciousPopulation, false);
  assert.equal(out.marrowBlastPopulationEvidence.populationPositiveAllowed, false);
});

test("PASS 4 — 005.50.21 consumes recovered provenance monotonically", () => {
  let out = applyMarrowFocalBlastoidAuthorityProvenance(normalizedLossCase());
  out = applyMarrowPositiveCellLevelBlastoidScopeLock(out);
  out = applyMarrowFocalBlastoidTerminalAuthority(out);
  assert.equal(out.marrowFocalBlastoidTerminalAuthority.active, true);
  assert.equal(out.finalClassification, "MARROW_BLASTOID_FOCAL_SUSPICION");
  assert.equal(out.finalMarrowAuthority.structuredBlast.suspicious, false);
  assert.equal(out.finalMarrowAuthority.structuredBlast.populationPositiveAllowed, false);
});

test("PASS 5 — Global Pattern cannot re-promote provenance-locked focal cytology", () => {
  let input = applyMarrowFocalBlastoidAuthorityProvenance(normalizedLossCase());
  const gp = analyzeGlobalPattern(input);
  assert.equal(gp.dominantPattern, "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN");
  assert.equal(gp.marrowPositiveBlastoidCytology, true);
  assert.equal(gp.marrowPopulationBlastEvidence, false);
  assert.equal(gp.populationPositiveAllowed, false);
});

test("PASS 6 — canonical presentation reflects focal provenance instead of NO_QUALIFIED authority", () => {
  let input = applyMarrowFocalBlastoidAuthorityProvenance(normalizedLossCase());
  input.globalPattern = analyzeGlobalPattern(input);
  const p = buildCanonicalClinicalPresentation(input);
  assert.equal(p.presentationPolicy.focalBlastoidFindingDoesNotEstablishPopulation, true);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, false);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, false);
  assert.match(p.presentationPolicy.marrowScopeAuthoritySource, /005\.50\.23|PROVENANCE/);
});

test("PASS 7 — independent OBSERVED_POPULATION supersedes focal provenance", () => {
  const input = focalRaw();
  input.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  const d = evaluateMarrowFocalBlastoidAuthorityProvenance(input);
  assert.equal(d.locked, false);
  assert.equal(d.independentPopulationEvidenceState, "OBSERVED_POPULATION");
  assert.equal(d.populationPositiveAllowed, true);
});

test("PASS 8 — independent SUSPICIOUS_POPULATION supersedes focal provenance", () => {
  const input = focalRaw();
  input.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  const d = evaluateMarrowFocalBlastoidAuthorityProvenance(input);
  assert.equal(d.locked, false);
  assert.equal(d.independentPopulationEvidenceState, "SUSPICIOUS_POPULATION");
});

test("PASS 9 — derived FOCAL_SUSPICION suspiciousPopulation does not count as independent population provenance", () => {
  const input = normalizedLossCase();
  const out = applyMarrowFocalBlastoidAuthorityProvenance(input);
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.locked, true);
  assert.equal(out.marrowFocalBlastoidAuthorityProvenance.independentPopulationEvidenceState, null);
});

test("PASS 10 — marrow sanitizer preserves 'não converter para ausência de blastos' meta-language", () => {
  const phrase = "BE-FIX-005.35: há sinal citológico focal; não converter para ausência de blastos nem para positividade blastoide automática.";
  const out = enforceBoneMarrowOutputContract({
    specimenType: "BONE_MARROW_ASPIRATE",
    morphologyAnalysis: { leukocyteReview: phrase },
  }, {
    specimenGate: { specimenType: "BONE_MARROW_ASPIRATE" },
  });
  assert.match(out.morphologyAnalysis.leukocyteReview, /não converter para ausência de blastos/i);
  assert.doesNotMatch(out.morphologyAnalysis.leukocyteReview, /não converter para O campo medular/i);
});

test("PASS 11 — server captures provenance before normalization and rehydrates it afterwards", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  const capture = source.indexOf("FOCAL BLASTOID AUTHORITY PROVENANCE CAPTURE");
  const normalize = source.indexOf("let mergedAnalysis = normalizeMedicalResponse");
  assert.ok(capture >= 0 && normalize >= 0 && capture < normalize);
  const rehydrate = source.indexOf("Rehydrate the immutable focal provenance");
  assert.ok(rehydrate > normalize);
});

test("PASS 12 — server exposes 005.50.23 runtime fingerprints", () => {
  const source = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  for (const key of [
    "marrowFocalBlastoidAuthorityProvenanceVersion",
    "marrowFocalBlastoidProvenanceMonotonicLockVersion",
    "marrowLegacyPopulationRepromotionEliminationVersion",
    "marrowFocalBlastoidProvenanceRecoveryVersion",
    "marrowFocalBlastoidProvenanceGlobalPatternVersion",
    "canonicalClinicalPresentationFocalProvenanceVersion",
    "marrowContextAwareNarrativeSanitizationVersion",
  ]) assert.ok(source.includes(key), `missing runtime key ${key}`);
});
