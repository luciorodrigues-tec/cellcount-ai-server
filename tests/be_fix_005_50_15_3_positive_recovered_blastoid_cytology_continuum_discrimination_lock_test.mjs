import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MARROW_POSITIVE_RECOVERED_BLASTOID_CYTOLOGY_CONTINUUM_LOCK_VERSION,
  evaluateMarrowMaturationContinuum,
  applyMarrowMaturationContinuumDiscrimination,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

function baseMarrow(){
  return {
    specimenType:"BONE_MARROW_ASPIRATE",
    marrowAdequacy:{limitedField:true},
    myeloidSeries:{
      maturation:true,
      expansionContext:{
        broadMaturationSpectrum:true,
        matureNeutrophilicFormsPresent:true,
      },
    },
    erythroidSeries:{maturation:true},
    blastAssessment:{
      evidenceState:"NOT_ASSESSABLE",
      observed:false,
      morphologySupport:{monomorphism:false},
      precursorContext:{
        maturationHeterogeneity:true,
        maturationContinuum:true,
        matureFormsPresent:true,
        lineageDiversity:true,
        nonMonomorphicBackground:true,
      },
      immatureCellCytology:{},
      blastoidSubpopulationContext:{},
    },
  };
}

test("PASS 0 — 005.50.15.3 fingerprint is registered",()=>{
  assert.equal(
    MARROW_POSITIVE_RECOVERED_BLASTOID_CYTOLOGY_CONTINUUM_LOCK_VERSION,
    "BE-FIX-005.50.15.3",
  );
});

test("PASS 1 — healthy heterogeneous marrow remains eligible for physiologic continuum",()=>{
  const r=baseMarrow();
  r.blastAssessment.immatureCellCytology={highNCRatio:true};
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.positiveRecoveredBlastoidCytology,false);
  assert.equal(e.strongPhysiologicContinuum,true);
});

test("PASS 2 — precursor-rich physiologic control is not converted to focal blastoid suspicion",()=>{
  const r=baseMarrow();
  r.visualMorphologyEvidenceAcquisition={
    repairAttempted:true,
    immatureCellCytologyRecovery:{
      multipleImmatureCells:true,
      repeatedImmatureCells:true,
      characterizedBlastCytologyCount:1,
      positiveBlastCytologyCount:0,
    },
  };
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.positiveRecoveredBlastoidCytology,false);
  assert.equal(e.unresolvedImmatureCandidateAfterAcquisition,true);
});

test("PASS 3 — LMA-like recovered 4/4 focal cytology cannot collapse to physiologic continuum",()=>{
  const r=baseMarrow();
  r.visualMorphologyEvidenceAcquisition={
    repairAttempted:true,
    immatureCellCytologyRecovery:{
      multipleImmatureCells:true,
      repeatedImmatureCells:true,
      characterizedBlastCytologyCount:4,
      positiveBlastCytologyCount:4,
    },
  };
  r.blastAssessment.immatureCellCytology={
    highNCRatio:true,
    openFineChromatin:true,
    nucleoli:true,
    scantBasophilicCytoplasm:true,
  };
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.positiveRecoveredBlastoidCytology,true);
  assert.equal(e.strongPhysiologicContinuum,false);
  assert.equal(e.classification,"INDETERMINATE_MATURATION_VS_BLASTOID");
});

test("PASS 4 — stale physiologic lock is revoked while focal evidence is preserved",()=>{
  const r=baseMarrow();
  r.blastAssessment.evidenceState="PHYSIOLOGIC_PRECURSOR_PATTERN";
  r.blastAssessment.candidateEvidenceState="PHYSIOLOGIC_MATURATION_CONTINUUM";
  r.blastAssessment.immatureCellCytology={
    highNCRatio:true,
    openFineChromatin:true,
    nucleoli:true,
    scantBasophilicCytoplasm:true,
  };
  r.marrowPhysiologicMaturationContinuumLock={active:true};
  r.visualMorphologyEvidenceAcquisition={
    repairAttempted:true,
    immatureCellCytologyRecovery:{
      characterizedBlastCytologyCount:4,
      positiveBlastCytologyCount:4,
    },
  };
  applyMarrowMaturationContinuumDiscrimination(r);
  assert.equal(r.marrowPhysiologicMaturationContinuumLock.active,false);
  assert.equal(r.blastAssessment.evidenceState,"FOCAL_SUSPICION");
  assert.equal(r.blastAssessment.observed,false);
  assert.equal(r.blastAssessment.positiveEvidenceLock.populationPositiveAllowed,false);
});

test("PASS 5 — focal positive cytology never synthesizes structured population architecture",()=>{
  const r=baseMarrow();
  r.blastAssessment.immatureCellCytology={
    highNCRatio:true,
    openFineChromatin:true,
    nucleoli:true,
    scantBasophilicCytoplasm:true,
  };
  r.visualMorphologyEvidenceAcquisition={
    repairAttempted:true,
    immatureCellCytologyRecovery:{
      characterizedBlastCytologyCount:4,
      positiveBlastCytologyCount:4,
    },
  };
  r.marrowRepairEvidenceMerge={
    singlePassArchitectureCore:false,
    repairArchitectureProvenanceVersion:"BE-FIX-005.50.15",
  };
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.structuredPathologicSubset,false);
  assert.equal(e.architectureProvenanceQualified,false);
});

test("PASS 6 — true observed blast population remains protected",()=>{
  const r=baseMarrow();
  r.blastAssessment.observed=true;
  r.blastAssessment.evidenceState="OBSERVED_POPULATION";
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.structuredPathologicSubset,true);
  assert.equal(e.classification,"PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED");
});

test("PASS 7 — server exposes 005.50.15.3 runtime fingerprint",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  assert.match(s,/MARROW_POSITIVE_RECOVERED_BLASTOID_CYTOLOGY_CONTINUUM_LOCK_VERSION/);
  assert.match(s,/marrowPositiveRecoveredBlastoidCytologyContinuumLockVersion/);
});
