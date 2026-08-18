import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  applyMarrowMaturationContinuumDiscrimination,
  evaluateMarrowMaturationContinuum,
  MARROW_POST_RECOVERY_MATURATION_CONTINUUM_REEVALUATION_VERSION,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

import {
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
} from "../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";

function physiologicBase() {
  return {
    specimenType: "BONE_MARROW_ASPIRATE",
    blastAssessment: {
      evidenceState: "NOT_ASSESSABLE",
      approximateBlastLikeCells: 0,
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
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
      },
      morphologySupport: {
        // One isolated immature cytologic trait is intentionally present.
        // This reproduces the pre-existing 005.37 physiologic anti-overcall
        // path without constituting a blastoid architecture.
        highNCRatio: true,
        monomorphism: false,
        repeatedAcrossField: false,
      },
    },
    marrowPrecursorDiscrimination: {
      explicitlyNotDistinctFromContinuum: true,
      maturationContinuumSupported: true,
      strongPhysiologicPattern: true,
      blastoidSubpopulationSignals: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
      },
      dualAxis: {
        observedEscalation: false,
        suspiciousEscalation: false,
      },
    },
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
  };
}

test("005.50.14.1 fingerprint is registered", () => {
  assert.equal(
    MARROW_POST_RECOVERY_MATURATION_CONTINUUM_REEVALUATION_VERSION,
    "BE-FIX-005.50.14.1",
  );
});

test("first pass may establish physiologic continuum when no unresolved candidate exists", () => {
  const input = physiologicBase();
  const out = applyMarrowMaturationContinuumDiscrimination(input);
  assert.equal(
    out.marrowMaturationContinuumDiscrimination.classification,
    "PHYSIOLOGIC_MATURATION_CONTINUUM",
  );
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.active, true);
  assert.equal(out.blastAssessment.evidenceState, "PHYSIOLOGIC_PRECURSOR_PATTERN");
});

test("post-recovery unresolved candidate revokes stale physiologic lock without creating blast positivity", () => {
  let out = applyMarrowMaturationContinuumDiscrimination(physiologicBase());

  out.visualMorphologyEvidenceAcquisition = {
    repairAttempted: true,
    immatureCellCytologyRecovery: {
      multipleImmatureCells: true,
      repeatedImmatureCells: true,
      characterizedBlastCytologyCount: 0,
      positiveBlastCytologyCount: 0,
    },
  };
  out.marrowImmatureCellCytologyRecovery = {
    candidateState: "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
    unresolvedCandidate: true,
    multipleImmature: true,
    repeatedImmature: true,
    characterizedCytologyCount: 0,
    positiveCytologyCount: 0,
  };

  out = applyMarrowMaturationContinuumDiscrimination(out);

  assert.equal(
    out.marrowMaturationContinuumDiscrimination
      .unresolvedImmatureCandidateAfterAcquisition,
    true,
  );
  assert.equal(
    out.marrowMaturationContinuumDiscrimination.classification,
    "INDETERMINATE_MATURATION_VS_BLASTOID",
  );
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.active, false);
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.revoked, true);
  assert.equal(out.blastAssessment.evidenceState, "NOT_ASSESSABLE");
  assert.equal(
    out.blastAssessment.candidateEvidenceState,
    "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
  );
  assert.notEqual(out.blastAssessment.evidenceState, "SUSPICIOUS_POPULATION");
  assert.notEqual(out.blastAssessment.evidenceState, "OBSERVED_POPULATION");
});

test("005.50.13 physiologic contradiction lock yields to unresolved post-recovery candidate", () => {
  let out = applyMarrowMaturationContinuumDiscrimination(physiologicBase());

  out.visualMorphologyEvidenceAcquisition = {
    repairAttempted: true,
    immatureCellCytologyRecovery: {
      multipleImmatureCells: true,
      repeatedImmatureCells: true,
      characterizedBlastCytologyCount: 0,
      positiveBlastCytologyCount: 0,
    },
  };
  out.marrowImmatureCellCytologyRecovery = {
    candidateState: "IMMATURE_POPULATION_REQUIRES_DISCRIMINATION",
    unresolvedCandidate: true,
  };

  out = applyMarrowMaturationContinuumDiscrimination(out);
  const decision =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(out);

  assert.equal(decision.unresolvedImmatureCandidateAfterAcquisition, true);
  assert.equal(decision.physiologicMaturationContradiction, false);
  assert.equal(decision.active, false);
});

test("healthy control remains physiologic when there is no unresolved repeated immature candidate", () => {
  const out = applyMarrowMaturationContinuumDiscrimination(physiologicBase());
  assert.equal(
    out.marrowMaturationContinuumDiscrimination
      .unresolvedImmatureCandidateAfterAcquisition,
    false,
  );
  assert.equal(out.marrowPhysiologicMaturationContinuumLock.active, true);
});

test("real observed blast population remains protected", () => {
  const input = physiologicBase();
  input.blastAssessment.evidenceState = "OBSERVED_POPULATION";
  input.blastAssessment.observed = true;
  input.blastAssessment.approximateBlastLikeCells = 10;
  input.blastAssessment.blastoidSubpopulationContext = {
    distinctFromMaturationContinuum: true,
    morphologicallyCoherent: true,
    repeatedSubsetAcrossField: true,
  };
  input.blastAssessment.morphologySupport = {
    monomorphism: true,
    repeatedAcrossField: true,
    highNCRatio: true,
    openFineChromatin: true,
  };

  const evaluated = evaluateMarrowMaturationContinuum(input);
  assert.equal(evaluated.observedStructuredPopulation, true);
  assert.equal(
    evaluated.classification,
    "PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED",
  );
});

test("server integrates 005.50.14.1 after 005.34 and refreshes 005.44", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  const recovered = server.indexOf(
    "parsed = applyMarrowRecoveredCytologyProjection(parsed);",
  );
  const marker = server.indexOf(
    'BE-FIX-005.50.14.1 — POST-RECOVERY MATURATION CONTINUUM RE-EVALUATION',
  );
  const reevaluate = server.indexOf(
    "parsed = applyMarrowMaturationContinuumDiscrimination(parsed);",
    recovered + 1,
  );
  const refreshSupersession = server.indexOf(
    "parsed = applyMarrowPositiveBlastEvidenceSemanticSupersession(parsed);",
    reevaluate + 1,
  );
  const raw = server.indexOf('console.log("RAW GPT RESPONSE")');

  assert.ok(recovered >= 0);
  assert.ok(marker > recovered);
  assert.ok(reevaluate > recovered);
  assert.ok(refreshSupersession > reevaluate);
  assert.ok(raw > refreshSupersession);
  assert.match(
    server,
    /marrowPostRecoveryMaturationContinuumReevaluationVersion/,
  );
});
