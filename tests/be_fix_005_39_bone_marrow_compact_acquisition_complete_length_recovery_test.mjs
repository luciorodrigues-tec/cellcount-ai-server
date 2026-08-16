import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BONE_MARROW_COMPACT_ACQUISITION_VERSION,
  BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,
  buildBoneMarrowCompactAcquisitionPrompt,
  buildBoneMarrowLengthRecoveryPrompt,
  buildBoneMarrowVisualRepairPrompt,
  mergeVisualMorphologyRepair,
  assessBoneMarrowVisualEvidenceAcquisition,
} from '../ai/visualMorphologyEvidenceAcquisitionContract.js';

const requiredMarrow = () => ({
  specimenAssessment:{status:'present',specimenType:'BONE_MARROW_ASPIRATE',summary:'medular'},
  marrowAdequacy:{status:'present',technicalQuality:'adequate',representativity:'field limited',summary:'avaliável'},
  myeloidSeries:{status:'present',maturation:'broad spectrum',summary:'mieloide',expansionContext:{relativeMyeloidPredominance:true,broadMaturationSpectrum:true}},
  erythroidSeries:{status:'present',maturation:'present',summary:'eritroide'},
  megakaryocyticSeries:{status:'notAssessable',maturation:'',summary:'não representada'},
  blastAssessment:{status:'present',evidenceState:'NOT_OBSERVED_IN_EVALUABLE_FIELD',approximateImmatureCellCount:6,immatureCellBurden:'multiple',spatialDistribution:'focal',morphologySupport:{openFineChromatin:false,repeatedAcrossField:false},precursorContext:{maturationContinuum:true,matureFormsPresent:true},blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false},summary:'sem arquitetura blastoide'},
});

test('PASS 0 — 005.39 identities are registered',()=>{
  assert.equal(BONE_MARROW_COMPACT_ACQUISITION_VERSION,'BE-FIX-005.39');
  assert.equal(BONE_MARROW_COMPLETE_LENGTH_RECOVERY_VERSION,'BE-FIX-005.39');
});

test('PASS 1 — compact marrow prompt prioritizes six required domains',()=>{
  const p=buildBoneMarrowCompactAcquisitionPrompt();
  for (const k of ['specimenAssessment','marrowAdequacy','myeloidSeries','erythroidSeries','megakaryocyticSeries','blastAssessment']) assert.match(p,new RegExp(k));
  assert.match(p,/ADQUIRIR EVIDÊNCIA ESTRUTURADA/i);
  assert.doesNotMatch(p,/Texto obrigatório com no mínimo 500 caracteres/i);
});

test('PASS 2 — compact prompt preserves 005.38 expansion acquisition',()=>{
  const p=buildBoneMarrowCompactAcquisitionPrompt();
  assert.match(p,/expansionContext/);
  assert.match(p,/relativeMyeloidPredominance/);
  assert.match(p,/disproportionateMyeloidRepresentation/);
});

test('PASS 3 — length recovery requests full marrow acquisition, not focal cytology only',()=>{
  const p=buildBoneMarrowLengthRecoveryPrompt({missingRequirements:['marrow_myeloidSeries']});
  for (const k of ['specimenAssessment','marrowAdequacy','myeloidSeries','erythroidSeries','megakaryocyticSeries','blastAssessment']) assert.match(p,new RegExp(k));
  assert.match(p,/truncada por limite de saída/i);
  assert.match(p,/não escreva relatório clínico/i);
});

test('PASS 4 — focal marrow repair remains distinct from length recovery',()=>{
  const focal=buildBoneMarrowVisualRepairPrompt({missingRequirements:['blastAssessment.immatureCellCytology']});
  const full=buildBoneMarrowLengthRecoveryPrompt({missingRequirements:['blastAssessment.immatureCellCytology']});
  assert.match(focal,/DISCRIMINAÇÃO FOCAL DE CÉLULAS IMATURAS/i);
  assert.match(full,/COMPLETE LENGTH-RECOVERY REPAIR/i);
  assert.notEqual(focal,full);
});

test('PASS 5 — complete recovered six-domain payload satisfies marrow VME',()=>{
  const a=assessBoneMarrowVisualEvidenceAcquisition({visionResponse:requiredMarrow(),analysisSource:'ai_visual'});
  assert.equal(a.zeroEvidence,false);
  assert.equal(a.missingRequirements.length,0);
  assert.equal(a.complete,true);
});

test('PASS 6 — length-recovery merge cannot erase first-pass positive cardinality',()=>{
  const original=requiredMarrow();
  original.blastAssessment.evidenceState='SUSPICIOUS_POPULATION';
  original.blastAssessment.approximateImmatureCellCount=18;
  original.blastAssessment.approximateBlastLikeCells=5;
  original.blastAssessment.morphologySupport.openFineChromatin=true;
  const repair=requiredMarrow();
  repair.blastAssessment.approximateImmatureCellCount=4;
  repair.blastAssessment.approximateBlastLikeCells=1;
  repair.blastAssessment.morphologySupport.openFineChromatin=false;
  const m=mergeVisualMorphologyRepair(original,repair);
  assert.equal(m.blastAssessment.approximateImmatureCellCount,18);
  assert.equal(m.blastAssessment.approximateBlastLikeCells,5);
  assert.equal(m.blastAssessment.morphologySupport.openFineChromatin,true);
});

test('PASS 7 — 005.39 deep merge preserves partial 005.38 expansion context',()=>{
  const original=requiredMarrow();
  original.myeloidSeries.expansionContext={relativeMyeloidPredominance:true,broadMaturationSpectrum:true,numerousGranulocyticPrecursors:true};
  const repair=requiredMarrow();
  repair.myeloidSeries.expansionContext={leftShiftedMaturationSpectrum:true};
  const m=mergeVisualMorphologyRepair(original,repair);
  assert.equal(m.myeloidSeries.expansionContext.relativeMyeloidPredominance,true);
  assert.equal(m.myeloidSeries.expansionContext.broadMaturationSpectrum,true);
  assert.equal(m.myeloidSeries.expansionContext.leftShiftedMaturationSpectrum,true);
});

test('PASS 8 — merge metadata exposes 005.39 recovery provenance',()=>{
  const m=mergeVisualMorphologyRepair(requiredMarrow(),requiredMarrow());
  assert.equal(m.marrowRepairEvidenceMerge.compactAcquisitionVersion,'BE-FIX-005.39');
  assert.equal(m.marrowRepairEvidenceMerge.completeLengthRecoveryVersion,'BE-FIX-005.39');
});

test('PASS 9 — server uses compact primary, length-specific recovery, runtime fingerprints',()=>{
  const s=fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
  assert.match(s,/buildBoneMarrowCompactAcquisitionPrompt\(\)/);
  assert.match(s,/buildBoneMarrowLengthRecoveryPrompt/);
  assert.match(s,/COMPLETE_LENGTH_RECOVERY/);
  assert.match(s,/FOCAL_MORPHOLOGY_REPAIR/);
  assert.match(s,/boneMarrowCompactAcquisitionVersion/);
  assert.match(s,/boneMarrowCompleteLengthRecoveryVersion/);
  assert.match(s,/OPENAI_MARROW_LENGTH_RECOVERY_MAX_COMPLETION_TOKENS/);
});
