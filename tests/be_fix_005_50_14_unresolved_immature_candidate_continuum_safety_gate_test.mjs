import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateMarrowMaturationContinuum,
  applyMarrowMaturationContinuumDiscrimination,
  MARROW_UNRESOLVED_IMMATURE_CANDIDATE_CONTINUUM_SAFETY_GATE_VERSION,
} from '../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js';

function baseMarrow(){
  return {
    specimenType:'BONE_MARROW',
    marrowAdequacy:{classification:'CLASS_1_LIMITED_FIELD'},
    myeloidSeries:{
      maturation:true,
      expansionContext:{broadMaturationSpectrum:true,matureNeutrophilicFormsPresent:true,leftShiftedMaturationSpectrum:true},
    },
    erythroidSeries:{maturation:true},
    blastAssessment:{
      evidenceState:'NOT_ASSESSABLE',
      populationPattern:'heterogeneous',
      morphologySupport:{monomorphism:false,repeatedAcrossField:false},
      immatureCellCytology:{},
      blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false},
      precursorContext:{maturationHeterogeneity:true,maturationContinuum:true,matureFormsPresent:true,lineageDiversity:true,nonMonomorphicBackground:true},
    },
  };
}

test('005.50.14 fingerprint is registered',()=>{
  assert.equal(MARROW_UNRESOLVED_IMMATURE_CANDIDATE_CONTINUUM_SAFETY_GATE_VERSION,'BE-FIX-005.50.14');
});

test('healthy mature heterogeneous marrow remains eligible for physiologic continuum',()=>{
  const r=baseMarrow();
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.unresolvedImmatureCandidateAfterAcquisition,false);
  assert.equal(e.strongPhysiologicContinuum,true);
  assert.equal(e.classification,'PHYSIOLOGIC_MATURATION_CONTINUUM');
});

test('repeated uncharacterized immature population cannot auto-collapse to physiologic continuum',()=>{
  const r=baseMarrow();
  r.visualMorphologyEvidenceAcquisition={repairAttempted:true,immatureCellCytologyRecovery:{
    multipleImmatureCells:true,repeatedImmatureCells:true,characterizedBlastCytologyCount:0,positiveBlastCytologyCount:0,
  }};
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.unresolvedImmatureCandidateAfterAcquisition,true);
  assert.equal(e.strongPhysiologicContinuum,false);
  assert.equal(e.classification,'INDETERMINATE_MATURATION_VS_BLASTOID');
  const out=applyMarrowMaturationContinuumDiscrimination(r);
  assert.notEqual(out.blastAssessment.evidenceState,'PHYSIOLOGIC_PRECURSOR_PATTERN');
  assert.equal(out.marrowPhysiologicMaturationContinuumLock,undefined);
});

test('005.33 candidate state independently blocks physiologic auto-collapse',()=>{
  const r=baseMarrow();
  r.blastAssessment.candidateEvidenceState='IMMATURE_POPULATION_REQUIRES_DISCRIMINATION';
  r.blastAssessment.cytologyRecoveryRequired=true;
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.unresolvedImmatureCandidateAfterAcquisition,true);
  assert.equal(e.classification,'INDETERMINATE_MATURATION_VS_BLASTOID');
});

test('real observed blast population remains protected and positive',()=>{
  const r=baseMarrow();
  r.blastAssessment={
    evidenceState:'OBSERVED_POPULATION', observed:true, approximateBlastLikeCells:12, populationPattern:'repeated',
    morphologySupport:{monomorphism:true,repeatedAcrossField:true,highNCRatio:true,openFineChromatin:true,nucleoli:true,scantBasophilicCytoplasm:true},
    immatureCellCytology:{highNCRatio:true,openFineChromatin:true,nucleoli:true,scantBasophilicCytoplasm:true},
    blastoidSubpopulationContext:{distinctFromMaturationContinuum:true,morphologicallyCoherent:true,repeatedSubsetAcrossField:true},
    precursorContext:{maturationContinuum:true,matureFormsPresent:true,lineageDiversity:true},
  };
  const e=evaluateMarrowMaturationContinuum(r);
  assert.equal(e.structuredPathologicSubset,true);
  assert.equal(e.classification,'PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED');
});
