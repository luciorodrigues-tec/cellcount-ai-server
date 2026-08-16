import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeVisualMorphologyRepair,
  MARROW_REPAIR_ARCHITECTURE_PROVENANCE_VERSION,
  MARROW_CYTOLOGY_TO_ARCHITECTURE_ANTIFABRICATION_VERSION,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";
import { evaluateMarrowMaturationContinuum } from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";
import { evaluateMarrowMyeloidExpansion } from "../ai/boneMarrow/marrowMyeloidExpansionDiscriminationEngine.js";
import { evaluateMarrowPrecursorDiscrimination } from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";
import { evaluateMarrowPositiveCytologyDiscordance } from "../ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";

function baseMarrow() {
  return {
    specimenAssessment: { specimenType: "BONE_MARROW_ASPIRATE" },
    marrowAdequacy: { status: "indeterminate" },
    myeloidSeries: {
      status: "present",
      maturation: "broad granulocytic maturation with mature forms",
      expansionContext: {
        relativeMyeloidPredominance: true,
        disproportionateMyeloidRepresentation: true,
        numerousGranulocyticPrecursors: true,
        broadMaturationSpectrum: true,
        matureNeutrophilicFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
        denseMyeloidField: true,
      },
    },
    erythroidSeries: { status: "present" },
    blastAssessment: {
      evidenceState: "NOT_ASSESSABLE",
      immatureCellBurden: "multiple",
      spatialDistribution: "repeated_across_field",
      approximateBlastLikeCells: 0,
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        repeatedAcrossField: true,
        monomorphism: false,
      },
      immatureCellCytology: {
        highNCRatio: true,
        openFineChromatin: true,
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: null,
        repeatedSubsetAcrossField: true,
      },
      precursorContext: {
        maturationHeterogeneity: true,
        maturationContinuum: true,
        matureFormsPresent: true,
        lineageDiversity: true,
        orderlyGranulocyticMaturation: true,
        nonMonomorphicBackground: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: null,
        repeatedSubsetAcrossField: true,
        matureFormsCoexist: true,
      },
    },
  };
}

function focalRepairOnlyAddsMissingArchitecturePieces() {
  return {
    blastAssessment: {
      evidenceState: "positiveMorphologicSuspicionForRepeatedImmatureBlastLikeCells",
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        repeatedAcrossField: false,
        monomorphism: false,
      },
      immatureCellCytology: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: false,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: false,
      },
    },
  };
}

function trueArchitectureRepair() {
  return {
    blastAssessment: {
      evidenceState: "SUSPICIOUS_POPULATION",
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        repeatedAcrossField: true,
        monomorphism: true,
      },
      immatureCellCytology: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
        coherentBlastoidSubsetObserved: true,
      },
    },
  };
}

test("PASS 0 — 005.45 identities are registered", () => {
  assert.equal(MARROW_REPAIR_ARCHITECTURE_PROVENANCE_VERSION, "BE-FIX-005.45");
  assert.equal(MARROW_CYTOLOGY_TO_ARCHITECTURE_ANTIFABRICATION_VERSION, "BE-FIX-005.45");
});

test("PASS 1 — focal repair cannot OR partial architecture across passes into a synthetic core", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  assert.equal(merged.marrowRepairEvidenceMerge.singlePassArchitectureCore, false);
  assert.equal(merged.marrowRepairEvidenceMerge.crossPassArchitectureSynthesisBlocked, true);
});

test("PASS 2 — cytologic traits remain additive while architecture remains provenance-bound", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  assert.equal(merged.blastAssessment.immatureCellCytology.nucleoli, true);
  assert.notEqual(
    merged.blastAssessment.blastoidSubpopulationContext.distinctFromMaturationContinuum,
    true,
  );
});

test("PASS 3 — 005.37 cannot promote repaired cytology to structured blast architecture without single-pass core", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = { repairAttempted: true };
  const e = evaluateMarrowMaturationContinuum(merged);
  assert.equal(e.architectureProvenanceQualified, false);
  assert.equal(e.structuredPathologicSubset, false);
});

test("PASS 4 — 005.38 recovers pathologic myeloid expansion rather than fabricated blastoid subset", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = { repairAttempted: true };
  const e = evaluateMarrowMyeloidExpansion(merged);
  assert.equal(e.blastArchitecture.structuredPathologicSubset, false);
  assert.equal(e.classification, "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");
});

test("PASS 5 — 005.27 suspicious blast escalation is provenance-gated", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = {
    repairAttempted: true,
    specimenScope: "BONE_MARROW",
  };
  const e = evaluateMarrowPrecursorDiscrimination(merged);
  assert.equal(e.architectureProvenanceQualified, false);
  assert.equal(e.protectedSuspiciousBlastoid, false);
});

test("PASS 6 — 005.35 does not label repair-derived positive state as structured population without architecture provenance", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    focalRepairOnlyAddsMissingArchitecturePieces(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = {
    repairAttempted: true,
    immatureCellCytologyRecovery: {
      multipleImmatureCells: true,
      repeatedImmatureCells: true,
      positiveBlastCytologyCount: 4,
      characterizedBlastCytologyCount: 4,
    },
    acquiredDomains: { structuredRepeat: true },
  };
  const e = evaluateMarrowPositiveCytologyDiscordance(merged);
  assert.equal(e.architectureQualifiedForStructuredPositive, false);
  assert.equal(e.structuredPositive, false);
});

test("PASS 7 — a true single-pass repair architecture core remains protected", () => {
  const merged = mergeVisualMorphologyRepair(
    baseMarrow(),
    trueArchitectureRepair(),
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = { repairAttempted: true };
  assert.equal(merged.marrowRepairEvidenceMerge.repairArchitectureCore, true);
  assert.equal(merged.marrowRepairEvidenceMerge.singlePassArchitectureCore, true);
  const e = evaluateMarrowMaturationContinuum(merged);
  assert.equal(e.architectureProvenanceQualified, true);
  assert.equal(e.structuredPathologicSubset, true);
});

test("PASS 8 — primary observed blast population remains protected regardless of repair provenance", () => {
  const primary = baseMarrow();
  primary.blastAssessment.observed = true;
  primary.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  primary.blastAssessment.approximateBlastLikeCells = 6;
  const merged = mergeVisualMorphologyRepair(
    primary,
    {},
    { repairMode: "FOCAL_MORPHOLOGY_REPAIR" },
  );
  merged.visualMorphologyEvidenceAcquisition = { repairAttempted: true };
  const e = evaluateMarrowMaturationContinuum(merged);
  assert.equal(e.structuredPathologicSubset, true);
});

test("PASS 9 — server passes repair mode and exposes 005.45 runtime fingerprints", async () => {
  const { readFile } = await import("node:fs/promises");
  const server = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /repairMode:/);
  assert.match(server, /marrowRepairArchitectureProvenanceVersion/);
  assert.match(server, /marrowCytologyToArchitectureAntiFabricationVersion/);
  assert.match(server, /BE-FIX-005\.45/);
});
