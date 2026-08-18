import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  assessBoneMarrowVisualEvidenceAcquisition,
  MARROW_PRIMARY_POSITIVE_CYTOLOGY_STABILITY_RECOVERY_VERSION,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

import {
  evaluateMarrowPositiveCytologyDiscordance,
  applyMarrowPositiveCytologyConsistency,
  MARROW_PRIMARY_OR_RECOVERED_POSITIVE_BLASTOID_CYTOLOGY_PRESERVATION_VERSION,
} from "../ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";

import {
  evaluateMarrowMaturationContinuum,
  applyMarrowMaturationContinuumDiscrimination,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

import {
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
} from "../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

function baseMarrow({
  positive = 0,
  characterized = 1,
  repeated = true,
  multiple = true,
  evidenceState = "NOT_ASSESSABLE",
  highNCRatio = null,
} = {}) {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    specimenAssessment: {
      status: "indeterminate",
      specimenType: "BONE_MARROW_ASPIRATE",
      summary: "Aspirado medular em campo limitado.",
    },
    marrowAdequacy: {
      status: "indeterminate",
      representativity: "campo limitado",
      summary: "campo limitado",
    },
    myeloidSeries: {
      status: "present",
      maturation: true,
      summary: "Precursores mieloides com formas maduras coexistentes.",
      expansionContext: {
        numerousGranulocyticPrecursors: multiple,
        broadMaturationSpectrum: true,
        matureNeutrophilicFormsPresent: true,
        leftShiftedMaturationSpectrum: multiple,
        denseMyeloidField: multiple,
      },
    },
    erythroidSeries: { status: "present", maturation: true, summary: "eritroide presente" },
    megakaryocyticSeries: { status: "notAssessable", summary: "não avaliável" },
    blastAssessment: {
      status: "indeterminate",
      observed: false,
      evidenceState,
      approximateBlastLikeCells: null,
      approximateImmatureCellCount: null,
      immatureCellBurden: multiple ? "multiple" : "few",
      spatialDistribution: repeated ? "repeated_across_field" : "isolated",
      populationPattern: "heterogeneous",
      morphologySupport: {
        highNCRatio,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: null,
        monomorphism: false,
        repeatedAcrossField: repeated,
      },
      immatureCellCytology: {
        highNCRatio,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: null,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: null,
        distinctFromMaturationContinuum: false,
      },
      precursorContext: {
        maturationHeterogeneity: true,
        maturationContinuum: true,
        matureFormsPresent: true,
        lineageDiversity: true,
        nonMonomorphicBackground: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: null,
        matureFormsCoexist: true,
      },
      summary: multiple
        ? "Múltiplas células imaturas/precursoras repetidas em continuum maturativo."
        : "Campo sem população imatura repetida.",
    },
    visualMorphologyEvidenceAcquisition: {
      specimenScope: "BONE_MARROW",
      complete: true,
      repairAttempted: false,
      immatureCellCytologyRecovery: {
        multipleImmatureCells: multiple,
        repeatedImmatureCells: repeated,
        characterizedBlastCytologyCount: characterized,
        positiveBlastCytologyCount: positive,
        approximateImmatureCellCount: null,
        explicitImmaturitySemantic: multiple,
      },
      acquiredDomains: {
        narrativeMentionsRepeatedImmature: repeated,
        structuredRepeat: repeated,
        narrativeStructuredDiscordance: false,
      },
    },
  };
}

test("PASS 0 — 005.50.15.4 fingerprints are registered", () => {
  assert.equal(
    MARROW_PRIMARY_POSITIVE_CYTOLOGY_STABILITY_RECOVERY_VERSION,
    "BE-FIX-005.50.15.4",
  );
  assert.equal(
    MARROW_PRIMARY_OR_RECOVERED_POSITIVE_BLASTOID_CYTOLOGY_PRESERVATION_VERSION,
    "BE-FIX-005.50.15.4",
  );
});

test("PASS 1 — production LMA-like 1/1 primary cytology requests bounded focal stability recovery", () => {
  const r = baseMarrow({ positive: 1, characterized: 1, highNCRatio: true });
  delete r.visualMorphologyEvidenceAcquisition;
  const a = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: r,
    analysisSource: "ai_visual",
  });
  assert.equal(a.immatureCellCytologyRecovery.multipleImmatureCells, true);
  assert.equal(a.immatureCellCytologyRecovery.repeatedImmatureCells, true);
  assert.equal(a.immatureCellCytologyRecovery.positiveBlastCytologyCount, 1);
  assert.equal(
    a.immatureCellCytologyRecovery.primaryPositiveCytologyStabilityRecoveryRecommended,
    true,
  );
  assert.equal(a.immatureCellCytologyRecoveryRequired, true);
  assert.equal(a.complete, false);
});

test("PASS 2 — stale physiologic lock cannot erase primary 1/1 positive cytology", () => {
  const r = baseMarrow({ positive: 1, characterized: 1, highNCRatio: true });
  r.blastAssessment.evidenceState = "PHYSIOLOGIC_PRECURSOR_PATTERN";
  r.blastAssessment.candidateEvidenceState = "PHYSIOLOGIC_MATURATION_CONTINUUM";
  r.marrowPhysiologicMaturationContinuumLock = {
    version: "BE-FIX-005.37",
    active: true,
    finalEvidenceState: "PHYSIOLOGIC_PRECURSOR_PATTERN",
  };

  const e = evaluateMarrowPositiveCytologyDiscordance(r);
  assert.equal(e.primaryOrRecoveredPositiveCytology, true);
  assert.equal(e.unresolvedPositiveCytology, true);

  const out = applyMarrowPositiveCytologyConsistency(r);
  assert.equal(out.blastAssessment.evidenceState, "UNRESOLVED_BLASTOID_CYTOLOGY");
  assert.equal(out.blastAssessment.observed, false);
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.active, false);
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.revoked, true);
});

test("PASS 3 — post-consistency 005.37 remains indeterminate, not physiologic and not blast-positive", () => {
  let r = baseMarrow({ positive: 1, characterized: 1, highNCRatio: true });
  r.blastAssessment.evidenceState = "PHYSIOLOGIC_PRECURSOR_PATTERN";
  r.marrowPhysiologicMaturationContinuumLock = { active: true };
  r = applyMarrowPositiveCytologyConsistency(r);
  r = applyMarrowMaturationContinuumDiscrimination(r);

  const d = r.marrowMaturationContinuumDiscrimination;
  assert.equal(d.unresolvedImmatureCandidateAfterAcquisition, true);
  assert.equal(d.strongPhysiologicContinuum, false);
  assert.equal(d.structuredPathologicSubset, false);
  assert.equal(d.classification, "INDETERMINATE_MATURATION_VS_BLASTOID");
  assert.notEqual(r.blastAssessment.evidenceState, "OBSERVED_POPULATION");
  assert.notEqual(r.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
});

test("PASS 4 — 005.50.13 physiologic contradiction suppression yields to unresolved 15.4 evidence", () => {
  let r = baseMarrow({ positive: 1, characterized: 1, highNCRatio: true });
  r.blastAssessment.evidenceState = "PHYSIOLOGIC_PRECURSOR_PATTERN";
  r.marrowPhysiologicMaturationContinuumLock = { active: true };
  r = applyMarrowPositiveCytologyConsistency(r);
  r = applyMarrowMaturationContinuumDiscrimination(r);
  const s = evaluateMarrowPositiveBlastEvidenceSemanticSupersession(r);
  assert.equal(s.unresolvedImmatureCandidateAfterAcquisition, true);
  assert.equal(s.physiologicMaturationContradiction, false);
});

test("PASS 5 — ordinary healthy marrow without repeated immaturity remains physiologic-eligible", () => {
  const r = baseMarrow({
    positive: 0,
    characterized: 1,
    highNCRatio: false,
    multiple: false,
    repeated: false,
  });
  const c = evaluateMarrowPositiveCytologyDiscordance(r);
  assert.equal(c.unresolvedPositiveCytology, false);
  const d = evaluateMarrowMaturationContinuum(r);
  assert.equal(d.positiveRecoveredBlastoidCytology, false);
  assert.equal(d.strongPhysiologicContinuum, true);
});

test("PASS 6 — precursor-rich zero-positive control is not converted into focal blast positivity", () => {
  const r = baseMarrow({ positive: 0, characterized: 1, highNCRatio: false });
  const out = applyMarrowPositiveCytologyConsistency(r);
  assert.notEqual(out.blastAssessment.evidenceState, "FOCAL_SUSPICION");
  assert.notEqual(out.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.equal(out.blastAssessment.observed, false);
});

test("PASS 7 — true structured/observed blast population remains protected", () => {
  const r = baseMarrow({ positive: 2, characterized: 2, highNCRatio: true });
  r.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  r.blastAssessment.observed = true;
  r.blastAssessment.blastoidSubpopulationContext = {
    distinctFromMaturationContinuum: true,
    morphologicallyCoherent: true,
    repeatedSubsetAcrossField: true,
  };
  const out = applyMarrowPositiveCytologyConsistency(r);
  assert.equal(out.blastAssessment.evidenceState, "OBSERVED_POPULATION");
  assert.equal(out.blastAssessment.observed, true);
});

test("PASS 8 — field limitation does not erase unresolved focal cytology and does not authorize population inference", () => {
  let r = baseMarrow({ positive: 1, characterized: 1, highNCRatio: true });
  r.fieldAdequacy = {
    limitedField: true,
    adequateForPopulationAssessment: false,
    populationInferenceAllowed: false,
  };
  r.blastAssessment.evidenceState = "PHYSIOLOGIC_PRECURSOR_PATTERN";
  r.marrowPhysiologicMaturationContinuumLock = { active: true };
  r = applyMarrowPositiveCytologyConsistency(r);
  assert.equal(r.blastAssessment.evidenceState, "UNRESOLVED_BLASTOID_CYTOLOGY");
  assert.equal(r.blastAssessment.globalAbsenceAllowed, false);
  assert.equal(r.fieldAdequacy.populationInferenceAllowed, false);
});

test("PASS 9 — server integrates 005.50.15.4 in repair routing, 005.35 and runtime fingerprints", () => {
  const s = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(s, /MARROW_PRIMARY_POSITIVE_CYTOLOGY_STABILITY_RECOVERY_VERSION/);
  assert.match(s, /MARROW_PRIMARY_OR_RECOVERED_POSITIVE_BLASTOID_CYTOLOGY_PRESERVATION_VERSION/);
  assert.match(s, /marrowPrimaryPositiveCytologyStabilityRecoveryVersion/);
  assert.match(s, /marrowPrimaryOrRecoveredPositiveBlastoidCytologyPreservationVersion/);
  const p35 = s.indexOf("applyMarrowPositiveCytologyConsistency(parsed)");
  const p34 = s.indexOf("applyMarrowRecoveredCytologyProjection(parsed)");
  const post = s.indexOf("BE-FIX-005.50.14.1 — POST-RECOVERY");
  assert.ok(p35 > -1 && p34 > p35 && post > p34);
});
