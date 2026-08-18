import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  assessBoneMarrowVisualEvidenceAcquisition,
  mergeVisualMorphologyRepair,
  MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION,
  MARROW_CROSS_PASS_EVIDENCE_PRESERVATION_VERSION,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

import {
  evaluateMarrowImmatureCellCytologyGap,
  MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION,
} from "../ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js";

function completeMarrow({
  precursorRich = false,
  evidenceState = "NOT_ASSESSABLE",
  blastLike = 0,
  immatureCount = null,
  burden = "indeterminate",
  spatial = "indeterminate",
  support = {},
  sub = {},
} = {}) {
  return {
    specimenAssessment: { status: "present", specimenType: "BONE_MARROW_ASPIRATE", summary: "medular" },
    marrowAdequacy: { status: "present", technicalQuality: "adequada", representativity: "campo", summary: "campo" },
    myeloidSeries: {
      status: "present",
      maturation: "heterogeneous",
      summary: "série mieloide observada",
      expansionContext: {
        numerousGranulocyticPrecursors: precursorRich,
        leftShiftedMaturationSpectrum: precursorRich,
        denseMyeloidField: precursorRich,
      },
    },
    erythroidSeries: { status: "present", maturation: "present", summary: "eritroide" },
    megakaryocyticSeries: { status: "notAssessable", maturation: "", summary: "não avaliável" },
    blastAssessment: {
      status: "indeterminate",
      observed: false,
      evidenceState,
      approximateBlastLikeCells: blastLike,
      approximateImmatureCellCount: immatureCount,
      immatureCellBurden: burden,
      spatialDistribution: spatial,
      populationPattern: "heterogeneous",
      morphologySupport: {
        highNCRatio: null,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: null,
        repeatedAcrossField: false,
        ...support,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
        ...sub,
      },
      summary: "avaliação blastoide",
    },
  };
}

test("005.50.15 fingerprints are registered", () => {
  assert.equal(
    MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION,
    "BE-FIX-005.50.15",
  );
  assert.equal(
    MARROW_CROSS_PASS_EVIDENCE_PRESERVATION_VERSION,
    "BE-FIX-005.50.15",
  );
  assert.equal(
    MARROW_CROSS_PASS_IMMATURE_CYTOMORPHOLOGY_RECOVERY_VERSION,
    "BE-FIX-005.50.15",
  );
});

test("precursor-rich complete marrow gets non-blocking focal stability re-observation", () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: completeMarrow({ precursorRich: true }),
    analysisSource: "ai_visual",
  });

  assert.equal(acquisition.complete, true);
  assert.equal(acquisition.status, "COMPLETE");
  assert.equal(acquisition.retryRecommended, true);
  assert.equal(acquisition.immatureCytomorphologyStabilityRecoveryRecommended, true);
  assert.ok(
    acquisition.missingRequirements.includes(
      "blastAssessment.immatureCellCytologyStability",
    ),
  );
});

test("ordinary healthy marrow without precursor-rich instability does not add a repair pass", () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: completeMarrow({ precursorRich: false }),
    analysisSource: "ai_visual",
  });

  assert.equal(acquisition.complete, true);
  assert.equal(acquisition.retryRecommended, false);
  assert.equal(acquisition.immatureCytomorphologyStabilityRecoveryRecommended, false);
});

test("positive primary cytology/state cannot be erased by a negative repair", () => {
  const primary = completeMarrow({
    precursorRich: true,
    evidenceState: "SUSPICIOUS_POPULATION",
    blastLike: 6,
    immatureCount: 8,
    burden: "multiple",
    spatial: "repeated_across_field",
    support: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: false,
      repeatedAcrossField: true,
    },
    sub: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
    },
  });

  const repair = completeMarrow({
    precursorRich: true,
    evidenceState: "NOT_ASSESSABLE",
    blastLike: 0,
    immatureCount: 0,
    support: {
      highNCRatio: false,
      openFineChromatin: false,
      nucleoli: false,
      scantBasophilicCytoplasm: false,
      repeatedAcrossField: false,
    },
  });

  const merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(merged.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.equal(merged.blastAssessment.approximateBlastLikeCells, 6);
  assert.equal(merged.blastAssessment.morphologySupport.highNCRatio, true);
  assert.equal(merged.blastAssessment.morphologySupport.openFineChromatin, true);
  assert.equal(merged.marrowCrossPassImmatureCytomorphologyEvidence.positiveEvidenceStatePreserved, true);
});

test("positive repair evidence enriches an indeterminate primary pass", () => {
  const primary = completeMarrow({
    precursorRich: true,
    evidenceState: "NOT_ASSESSABLE",
    blastLike: 0,
  });
  const repair = completeMarrow({
    precursorRich: true,
    evidenceState: "SUSPICIOUS_POPULATION",
    blastLike: 4,
    immatureCount: 6,
    burden: "multiple",
    spatial: "repeated_across_field",
    support: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: false,
      scantBasophilicCytoplasm: true,
      repeatedAcrossField: true,
    },
    sub: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
    },
  });

  const merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(merged.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.equal(merged.blastAssessment.approximateBlastLikeCells, 4);
  assert.equal(merged.marrowCrossPassImmatureCytomorphologyEvidence.positiveEvidenceStatePreserved, true);
});

test("architecture split across passes is never synthesized into a false structured blast population", () => {
  const primary = completeMarrow({
    precursorRich: true,
    support: { highNCRatio: true, repeatedAcrossField: true },
    sub: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: false,
      repeatedSubsetAcrossField: true,
    },
  });
  const repair = completeMarrow({
    precursorRich: true,
    support: { openFineChromatin: true, repeatedAcrossField: false },
    sub: {
      distinctFromMaturationContinuum: false,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: false,
    },
  });

  const merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.singlePassArchitectureCore,
    false,
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence.crossPassArchitectureSynthesisForbidden,
    true,
  );
  assert.equal(
    merged.marrowRepairEvidenceMerge.crossPassArchitectureSynthesisBlocked,
    true,
  );
});

test("005.33 can consume preserved cross-pass repeated/multiple evidence without fabricating positivity", () => {
  const result = completeMarrow({
    precursorRich: true,
    evidenceState: "NOT_ASSESSABLE",
    blastLike: 0,
  });
  result.specimenType = "BONE_MARROW_ASPIRATE";
  result.marrowCrossPassImmatureCytomorphologyEvidence = {
    version: "BE-FIX-005.50.15",
    multipleImmatureAnyPass: true,
    repeatedImmatureAnyPass: true,
    positiveEvidenceStatePreserved: false,
  };

  const gap = evaluateMarrowImmatureCellCytologyGap(result);
  assert.equal(gap.unresolvedCandidate, true);
  assert.equal(gap.directPositiveProtected, false);
  assert.equal(gap.candidateState, "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION");
});

test("server routes stability recovery through repair and retains 005.50.14.1 ordering", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /immatureCytomorphologyStabilityRecoveryRecommended/);
  assert.match(server, /MARROW_IMMATURE_CYTOMORPHOLOGY_ACQUISITION_STABILITY_VERSION/);
  assert.match(server, /marrowCrossPassEvidencePreservationVersion/);

  const recovered = server.indexOf(
    "parsed = applyMarrowRecoveredCytologyProjection(parsed);",
  );
  const reevaluate = server.indexOf(
    "parsed = applyMarrowMaturationContinuumDiscrimination(parsed);",
    recovered + 1,
  );
  const refresh = server.indexOf(
    "parsed = applyMarrowPositiveBlastEvidenceSemanticSupersession(parsed);",
    reevaluate + 1,
  );
  assert.ok(recovered >= 0);
  assert.ok(reevaluate > recovered);
  assert.ok(refresh > reevaluate);
});
