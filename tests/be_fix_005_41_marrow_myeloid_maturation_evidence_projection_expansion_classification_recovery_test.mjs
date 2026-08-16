import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION,
  MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION,
  evaluateMarrowMyeloidExpansion,
  applyMarrowMyeloidExpansionDiscrimination,
} from "../ai/boneMarrow/marrowMyeloidExpansionDiscriminationEngine.js";

import {
  MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION,
  evaluateMarrowMaturationContinuum,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

import {
  MARROW_SCOPE_PROPAGATION_RECOVERY_VERSION,
  evaluateMarrowPrecursorDiscrimination,
} from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";

function productionLikeMyeloidExpansion() {
  return {
    specimenAssessment: {
      specimenType: "boneMarrowAspirateSmear",
      status: "present",
    },
    marrowAdequacy: { status: "adequateForFocalMorphologicAssessment" },
    visualMorphologyEvidenceAcquisition: {
      specimenScope: "BONE_MARROW",
      complete: true,
    },
    myeloidSeries: {
      status: "assessable",
      maturation: "present",
      summary: "Série mieloide presente com maturação heterogênea e formas granulocíticas maduras coexistentes.",
      maturationSpectrum: "granulocytic maturation present with segmented/band forms and less mature precursors",
      prominentMatureNeutrophils: true,
      morphologicNotes: "Há granulócitos maduros segmentados e formas em maturação; coexistem células precursoras de maior tamanho.",
      expansionContext: {
        relativeMyeloidPredominance: true,
        broadMaturationSpectrum: true,
        numerousGranulocyticPrecursors: true,
        matureNeutrophilicFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
        basophilEosinophilEnrichment: false,
        erythroidRelativeReduction: false,
        disproportionateMyeloidRepresentation: true,
        denseMyeloidField: true,
      },
    },
    erythroidSeries: {
      status: "assessable",
      maturation: "present",
      summary: "Série eritroide identificável, menos representada que a mieloide no campo analisado.",
    },
    blastAssessment: {
      status: "indeterminate",
      evidenceState: "positiveMorphologicSuspicion",
      approximateBlastLikeCells: 0,
      approximateImmatureCellCount: 0,
      immatureCellBurden: "multiple",
      populationPattern: "repeatedSubsetAcrossField",
      precursorContext: {
        backgroundMaturationPresent: true,
        myeloidMaturationPresent: true,
        erythroidPrecursorsPresent: true,
        // Production signature: maturationContinuum may be absent/false even
        // though myeloidSeries already contains explicit maturation evidence.
        maturationContinuum: false,
      },
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        monomorphism: false,
        repeatedAcrossField: true,
      },
      immatureCellCytology: {
        morphologicallyCoherent: false,
        distinctFromMaturationContinuum: false,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
        disproportionateImmatureSubset: false,
        matureFormsCoexist: true,
      },
    },
    findings: {},
  };
}

function normalMarrow() {
  const x = productionLikeMyeloidExpansion();
  x.myeloidSeries.expansionContext = {
    relativeMyeloidPredominance: false,
    broadMaturationSpectrum: true,
    numerousGranulocyticPrecursors: false,
    matureNeutrophilicFormsPresent: true,
    leftShiftedMaturationSpectrum: false,
    erythroidRelativeReduction: false,
    disproportionateMyeloidRepresentation: false,
    denseMyeloidField: false,
  };
  x.myeloidSeries.summary = "Maturação granulocítica presente sem expansão mieloide desproporcional.";
  return x;
}

function trueBlastPopulation() {
  const x = productionLikeMyeloidExpansion();
  x.blastAssessment = {
    ...x.blastAssessment,
    evidenceState: "OBSERVED_POPULATION",
    observed: true,
    approximateBlastLikeCells: 12,
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      monomorphism: true,
      repeatedAcrossField: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
  };
  return x;
}

test("PASS 0 — 005.41 identities are registered", () => {
  assert.equal(MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION, "BE-FIX-005.41");
  assert.equal(MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION, "BE-FIX-005.41");
  assert.equal(MARROW_MATURATION_EVIDENCE_PROJECTION_VERSION, "BE-FIX-005.41");
  assert.equal(MARROW_SCOPE_PROPAGATION_RECOVERY_VERSION, "BE-FIX-005.41");
});

test("PASS 1 — structured myeloid maturation evidence recovers the 005.38 maturation axis", () => {
  const e = evaluateMarrowMyeloidExpansion(productionLikeMyeloidExpansion());
  assert.equal(e.structuredMaturationPresent, true);
  assert.equal(e.maturationContinuum, true);
  assert.equal(e.maturationAxis, true);
});

test("PASS 2 — production-like expansion is recovered from indeterminate to pathologic myeloid expansion with maturation", () => {
  const e = evaluateMarrowMyeloidExpansion(productionLikeMyeloidExpansion());
  assert.equal(e.disproportionateAxis, true);
  assert.equal(e.expansionBurdenAxis, true);
  assert.ok(e.expansionScore >= 4);
  assert.equal(e.pathologicMyeloidExpansionSupported, true);
  assert.equal(e.classification, "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");
});

test("PASS 3 — 005.41 does not fabricate pathologic expansion from normal maturation", () => {
  const e = evaluateMarrowMyeloidExpansion(normalMarrow());
  assert.equal(e.maturationAxis, true);
  assert.equal(e.disproportionateAxis, false);
  assert.equal(e.pathologicMyeloidExpansionSupported, false);
});

test("PASS 4 — 005.37 also receives structured maturation evidence instead of false absence", () => {
  const e = evaluateMarrowMaturationContinuum(productionLikeMyeloidExpansion());
  assert.equal(e.structuredMaturationPresent, true);
  assert.equal(e.maturationContinuum, true);
  assert.equal(e.maturationEvidenceProjectionVersion, "BE-FIX-005.41");
});

test("PASS 5 — boneMarrowAspirateSmear and VME scope propagate marrow=true into precursor discrimination", () => {
  const d = evaluateMarrowPrecursorDiscrimination(productionLikeMyeloidExpansion());
  assert.equal(d.marrow, true);
  assert.equal(d.marrowScopePropagationRecoveryVersion, "BE-FIX-005.41");
});

test("PASS 6 — recovered expansion lock reaches precursor discrimination as the third marrow state", () => {
  const locked = applyMarrowMyeloidExpansionDiscrimination(productionLikeMyeloidExpansion());
  const d = evaluateMarrowPrecursorDiscrimination(locked);
  assert.equal(locked.marrowPathologicMaturationContinuumLock.active, true);
  assert.equal(d.pathologicMyeloidExpansionProtected, true);
  assert.equal(d.classification, "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");
});

test("PASS 7 — true structured blastoid population still outranks recovered expansion", () => {
  const e = evaluateMarrowMyeloidExpansion(trueBlastPopulation());
  assert.equal(e.structuredPathologicSubset, true);
  assert.equal(e.pathologicMyeloidExpansionSupported, false);
  assert.equal(e.classification, "PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED");
});

test("PASS 8 — 005.41 remains morphology-only and does not diagnose CML/BCR::ABL1", () => {
  const out = applyMarrowMyeloidExpansionDiscrimination(productionLikeMyeloidExpansion());
  assert.doesNotMatch(out.mainFinding || "", /\bCML\b|\bLMC\b|BCR::ABL1|leucemia mieloide cr[oô]nica/i);
  assert.match(out.clinicalMeaning || "", /não estabelece diagnóstico/i);
});

test("PASS 9 — server exposes 005.41 runtime fingerprints and production logging", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /marrowMyeloidMaturationEvidenceProjectionVersion/);
  assert.match(server, /marrowExpansionClassificationRecoveryVersion/);
  assert.match(server, /marrowMaturationEvidenceProjectionVersion/);
  assert.match(server, /marrowScopePropagationRecoveryVersion/);
  assert.match(server, /BE-FIX-005\.41 — MARROW MYELOID MATURATION EVIDENCE PROJECTION \/ EXPANSION CLASSIFICATION RECOVERY/);
});
