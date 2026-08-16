import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyFinalMarrowAuthority,
  evaluateFinalMarrowAuthority,
  MARROW_FINAL_CLINICAL_AUTHORITY_VERSION,
  MARROW_POST_LEGACY_RECONCILIATION_VERSION,
  MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION,
} from "../ai/boneMarrow/marrowFinalClinicalAuthorityEngine.js";

import applyFinalClinicalGovernor, {
  MARROW_FINAL_GOVERNOR_AXIS_SEPARATION_VERSION,
} from "../ai/finalClinicalGovernor.js";

function protectedExpansionCase() {
  return {
    finalClassification: "CLASS_4_BLAST_SUSPICION",
    morphologicRiskClass: "CLASS_4_BLAST_SUSPICION",
    riskLevel: "Suspeita de população imatura/blástica",
    normalityBlocked: true,
    requiresHumanReview: true,
    findings: {
      blastSuspicion: true,
      immatureCells: true,
      focalImmatureCytologyObserved: true,
      blastEvidenceState: "FOCAL_SUSPICION",
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
    },
    adequacyAssessment: {
      classification: "LIMITED_FIELD",
    },
    marrowMyeloidExpansionDiscrimination: {
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      pathologicMyeloidExpansionSupported: true,
      structuredPathologicSubset: false,
    },
    marrowPathologicMaturationContinuumLock: {
      active: true,
      classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      blastoidPopulationSupported: false,
    },
    marrowPositiveBlastEvidenceSemanticSupersession: {
      active: true,
      approximateBlastLikeCells: 2,
      populationPositiveAllowed: false,
    },
    marrowFinalBlastProjectionLock: {
      active: true,
      populationBlastSuspicion: false,
      focalCytologyPreserved: true,
      globalBlastExclusionAllowed: false,
      dominantPattern: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    },
    marrowDominantPatternStateReconciliation: {
      active: true,
    },
    marrowBlastPopulationEvidence: {
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: false,
      evidenceState: "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION",
    },
    marrowPrecursorDiscrimination: {
      protectedObservedBlastoid: false,
      protectedSuspiciousBlastoid: false,
      coherentBlastoidSubpopulation: false,
      dualAxis: {
        observedEscalation: false,
        suspiciousEscalation: false,
      },
      blastoidSubpopulationSignals: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
      },
    },
    globalPattern: {
      dominantPattern: "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
      marrowPositiveBlastEvidence: false,
      pathologicMyeloidExpansionPattern: true,
    },
    localMorphologyEvidence: {
      evidenceAvailable: true,
      leukocytes: {
        description:
          "A arquitetura é de expansão mieloide com maturação, e não de população blastoide monomórfica.",
      },
    },
    mainFinding:
      "População mononuclear imatura/atípica suspeita. Não classificar como campo limitado simples.",
    overallAssessment: {},
    structuredReport: {},
    morphologyAnalysis: {},
    patternRecognition: {},
    confidenceAnalysis: {},
    rawResponse: {
      positiveFindings: {
        blastSuspicion: true,
        immatureCells: true,
      },
    },
  };
}

function trueBlastCase() {
  const r = protectedExpansionCase();
  r.marrowBlastPopulationEvidence = {
    observedPopulation: false,
    suspiciousPopulation: true,
    evidenceState: "SUSPICIOUS_POPULATION",
  };
  r.marrowPrecursorDiscrimination = {
    protectedObservedBlastoid: false,
    protectedSuspiciousBlastoid: true,
    coherentBlastoidSubpopulation: true,
    architectureProvenanceQualified: true,
    dualAxis: {
      observedEscalation: false,
      suspiciousEscalation: true,
    },
    blastoidSubpopulationSignals: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
    },
  };
  r.marrowFinalBlastProjectionLock.populationBlastSuspicion = true;
  return r;
}

test("PASS 0 — 005.46 identities are registered", () => {
  assert.equal(MARROW_FINAL_CLINICAL_AUTHORITY_VERSION, "BE-FIX-005.46");
  assert.equal(MARROW_POST_LEGACY_RECONCILIATION_VERSION, "BE-FIX-005.46");
  assert.equal(MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION, "BE-FIX-005.46");
  assert.equal(MARROW_FINAL_GOVERNOR_AXIS_SEPARATION_VERSION, "BE-FIX-005.46");
});

test("PASS 1 — terminal authority detects protected expansion after stale legacy blast restore", () => {
  const a = evaluateFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(a.applyExpansionAuthority, true);
  assert.equal(a.structuredBlast.structured, false);
});

test("PASS 2 — post-legacy blast resurrection is cleared at population level", () => {
  const out = applyFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(out.findings.blastSuspicion, false);
  assert.equal(out.findings.immatureCells, false);
  assert.equal(
    out.finalClassification,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
});

test("PASS 3 — focal cytology remains preserved while population-level blast class is cleared", () => {
  const out = applyFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(out.findings.focalImmatureCytologyObserved, true);
  assert.equal(
    out.findings.blastEvidenceState,
    "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION",
  );
  assert.equal(out.finalMarrowAuthority.rawEvidencePreserved, true);
});

test("PASS 4 — limited field is retained as adequacy axis, not morphology class", () => {
  const out = applyFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(
    out.marrowAdequacyMorphologyAxis.adequacyClassification,
    "CLASS_1_LIMITED_FIELD",
  );
  assert.equal(
    out.marrowAdequacyMorphologyAxis.morphologyClassification,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.notEqual(out.morphologicRiskClass, "CLASS_1_LIMITED_FIELD");
});

test("PASS 5 — global pattern and overall assessment are terminally reconciled", () => {
  const out = applyFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(
    out.globalPattern.dominantPattern,
    "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
  );
  assert.equal(out.globalPattern.marrowPositiveBlastEvidence, false);
  assert.equal(
    out.overallAssessment.riskCategory,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
});

test("PASS 6 — true structured suspicious blast population outranks expansion authority", () => {
  const out = applyFinalMarrowAuthority(trueBlastCase());
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(
    out.finalClassification,
    "MARROW_BLASTOID_POPULATION_SUSPICIOUS",
  );
});

test("PASS 7 — generic final governor no longer lets stale blast flag outrank canonical marrow expansion lock", () => {
  const out = applyFinalClinicalGovernor(protectedExpansionCase());
  assert.equal(
    out.finalClassification,
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  );
  assert.equal(
    out.evidenceGovernance.adequacyClassification,
    "CLASS_1_LIMITED_FIELD",
  );
});

test("PASS 8 — 005.46 does not create global blast-negative exclusion", () => {
  const out = applyFinalMarrowAuthority(protectedExpansionCase());
  assert.equal(
    out.marrowFinalBlastProjectionLock.globalBlastExclusionAllowed,
    false,
  );
  assert.equal(out.finalMarrowAuthority.blastPopulationExcludedByAuthority, true);
});

test("PASS 9 — server applies 005.46 after legacy writers and before CRA, with runtime fingerprints", async () => {
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(server, /BE-FIX-005\.46 — FINAL MARROW AUTHORITY/);
  assert.match(server, /applyFinalMarrowAuthority\(finalResult\)/);
  assert.match(server, /marrowFinalClinicalAuthorityVersion/);
  assert.match(server, /marrowPostLegacyReconciliationVersion/);
  assert.match(server, /marrowAdequacyMorphologyAxisSeparationVersion/);

  const legacy = server.indexOf("RAW POSITIVE FINDINGS FINAL RESTORE");
  const authority = server.lastIndexOf("applyFinalMarrowAuthority(finalResult)");
  const cra = server.indexOf("attachClinicalResultV2", authority);

  assert.ok(legacy >= 0);
  assert.ok(authority > legacy);
  assert.ok(cra > authority);
});
