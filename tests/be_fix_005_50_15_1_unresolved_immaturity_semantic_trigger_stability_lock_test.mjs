import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  assessBoneMarrowVisualEvidenceAcquisition,
  mergeVisualMorphologyRepair,
  MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_TRIGGER_VERSION,
  MARROW_STABILITY_RECOVERY_UNRESOLVED_LOCK_VERSION,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

import {
  evaluateMarrowImmatureCellCytologyGap,
  applyMarrowImmatureCellCytologyRecovery,
  MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION,
  MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION,
} from "../ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js";

function marrowBase() {
  return {
    specimenAssessment: {
      status: "indeterminate",
      specimenType: "BONE_MARROW_ASPIRATE",
      summary: "aspirado medular",
    },
    marrowAdequacy: {
      status: "indeterminate",
      technicalQuality: "campo limitado",
      representativity: "campo único",
      summary: "avaliável localmente",
    },
    myeloidSeries: {
      status: "present",
      maturation: "heterogeneous",
      summary: "mieloide",
      expansionContext: {
        numerousGranulocyticPrecursors: null,
        leftShiftedMaturationSpectrum: null,
        denseMyeloidField: null,
      },
    },
    erythroidSeries: {
      status: "present",
      maturation: "present",
      summary: "eritroide",
    },
    megakaryocyticSeries: {
      status: "notObserved",
      maturation: "",
      summary: "não observado",
    },
    blastAssessment: {
      status: "indeterminate",
      observed: null,
      evidenceState: "NOT_ASSESSABLE",
      approximateBlastLikeCells: null,
      approximateImmatureCellCount: null,
      immatureCellBurden: "indeterminate",
      spatialDistribution: "indeterminate",
      populationPattern: "heterogeneous",
      morphologySupport: {
        highNCRatio: null,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: null,
        monomorphism: false,
        repeatedAcrossField: null,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: null,
      },
      summary:
        "Há imaturidade/precursoras, mas sem subpopulação blastoide distinta sustentada neste campo.",
    },
    blastSuspicion: {
      status: "indeterminate",
      summary:
        "Imaturidade presente no contexto maturativo; critérios discriminativos insuficientes.",
    },
    positiveFindings: [
      "múltiplas células hematopoéticas nucleadas",
      "imaturidade/precursoras presentes",
    ],
  };
}

test("005.50.15.1 fingerprints are registered", () => {
  assert.equal(
    MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_TRIGGER_VERSION,
    "BE-FIX-005.50.15.1",
  );
  assert.equal(
    MARROW_STABILITY_RECOVERY_UNRESOLVED_LOCK_VERSION,
    "BE-FIX-005.50.15.1",
  );
  assert.equal(
    MARROW_UNRESOLVED_IMMATURITY_SEMANTIC_RECOVERY_VERSION,
    "BE-FIX-005.50.15.1",
  );
  assert.equal(
    MARROW_RECOVERED_IMMATURE_CARDINALITY_UNRESOLVED_LOCK_VERSION,
    "BE-FIX-005.50.15.1",
  );
});

test("explicit unresolved immaturity with null cardinality triggers stability recovery", () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: marrowBase(),
    analysisSource: "ai_visual",
  });

  assert.equal(acquisition.complete, true);
  assert.equal(acquisition.retryRecommended, true);
  assert.equal(
    acquisition.immatureCytomorphologyStabilityRecoveryRecommended,
    true,
  );
  assert.equal(acquisition.semanticUnresolvedImmaturity, true);
  assert.ok(
    acquisition.missingRequirements.includes(
      "blastAssessment.immatureCellCytologyStability",
    ),
  );
});

test("null immature cardinality is not silently converted to numeric zero", () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: marrowBase(),
    analysisSource: "ai_visual",
  });

  assert.equal(
    acquisition.immatureCellCytologyRecovery.approximateImmatureCellCount,
    null,
  );
});

test("resolved healthy morphology without explicit unresolved immaturity does not trigger semantic fallback", () => {
  const healthy = marrowBase();
  healthy.blastAssessment.status = "present";
  healthy.blastAssessment.summary =
    "Precursores fisiológicos em continuum maturativo heterogêneo, adequadamente caracterizados.";
  healthy.blastAssessment.morphologySupport = {
    highNCRatio: false,
    openFineChromatin: false,
    nucleoli: false,
    scantBasophilicCytoplasm: false,
    monomorphism: false,
    repeatedAcrossField: false,
  };
  healthy.blastSuspicion = {
    status: "notObserved",
    summary: "Sem suspeita blastoide estruturada no campo.",
  };
  healthy.positiveFindings = ["maturação granulocítica heterogênea"];

  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: healthy,
    analysisSource: "ai_visual",
  });

  assert.equal(acquisition.semanticUnresolvedImmaturity, false);
});

test("repair-recovered multiple immature cells with zero cytologic characterization are preserved as unresolved", () => {
  const primary = marrowBase();
  const repair = marrowBase();

  repair.blastAssessment.evidenceState = "limitedMorphologicEvidence";
  repair.blastAssessment.approximateImmatureCellCount = 6;
  repair.blastAssessment.approximateBlastLikeCells = 0;
  repair.blastAssessment.morphologySupport = {
    highNCRatio: null,
    openFineChromatin: null,
    nucleoli: null,
    scantBasophilicCytoplasm: null,
    monomorphism: false,
    repeatedAcrossField: null,
  };

  const merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence
      .maximumImmatureCellCount,
    6,
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence
      .unresolvedEvidenceStatePreserved,
    true,
  );
  assert.equal(
    merged.marrowCrossPassImmatureCytomorphologyEvidence
      .recoveredMultipleUncharacterizedImmaturity,
    true,
  );

  const gap = evaluateMarrowImmatureCellCytologyGap({
    ...merged,
    specimenType: "BONE_MARROW_ASPIRATE",
  });

  assert.equal(gap.multipleImmature, true);
  assert.equal(gap.directPositiveProtected, false);
  assert.equal(gap.unresolvedCandidate, true);
  assert.equal(
    gap.candidateState,
    "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
  );
});

test("005.33 converts unresolved limited morphologic evidence to indeterminate candidate, never blast positive", () => {
  const primary = marrowBase();
  const repair = marrowBase();
  repair.blastAssessment.evidenceState = "limitedMorphologicEvidence";
  repair.blastAssessment.approximateImmatureCellCount = 6;
  repair.blastAssessment.approximateBlastLikeCells = 0;

  let merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });
  merged.specimenType = "BONE_MARROW_ASPIRATE";

  merged = applyMarrowImmatureCellCytologyRecovery(merged);

  assert.equal(
    merged.blastAssessment.candidateEvidenceState,
    "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
  );
  assert.equal(
    merged.blastAssessment.evidenceState,
    "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
  );
  assert.equal(merged.blastAssessment.approximateBlastLikeCells, null);
  assert.notEqual(merged.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.notEqual(merged.blastAssessment.evidenceState, "OBSERVED_POPULATION");
});

test("true positive state remains protected and is never downgraded by 005.50.15.1", () => {
  const primary = marrowBase();
  primary.blastAssessment.evidenceState = "SUSPICIOUS_POPULATION";
  primary.blastAssessment.approximateBlastLikeCells = 7;
  primary.blastAssessment.approximateImmatureCellCount = 8;
  primary.blastAssessment.morphologySupport.highNCRatio = true;
  primary.blastAssessment.morphologySupport.openFineChromatin = true;

  const repair = marrowBase();
  repair.blastAssessment.evidenceState = "limitedMorphologicEvidence";
  repair.blastAssessment.approximateImmatureCellCount = 4;

  const merged = mergeVisualMorphologyRepair(primary, repair, {
    repairMode: "FOCAL_MORPHOLOGY_REPAIR",
  });

  assert.equal(merged.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.equal(merged.blastAssessment.approximateBlastLikeCells, 7);
});

test("server exposes 005.50.15.1 runtime fingerprints without changing 005.50.14.1 ordering", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /marrowUnresolvedImmaturitySemanticTriggerVersion/);
  assert.match(server, /marrowStabilityRecoveryUnresolvedLockVersion/);
  assert.match(server, /marrowRecoveredImmatureCardinalityUnresolvedLockVersion/);

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
