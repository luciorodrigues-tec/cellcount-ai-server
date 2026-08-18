import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessBoneMarrowVisualEvidenceAcquisition,
  MARROW_IMMATURE_BLASTOID_CELL_LEVEL_CYTOMORPHOLOGY_ACQUISITION_RECOVERY_VERSION,
  MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_LOCK_VERSION,
} from '../ai/visualMorphologyEvidenceAcquisitionContract.js';
import {
  applyMarrowImmatureCellCytologyRecovery,
  MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION,
} from '../ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js';
import {
  applyMarrowMaturationContinuumDiscrimination,
  MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_CONTINUUM_GATE_VERSION,
} from '../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js';

function baseMarrow(overrides={}) {
  return {
    specimenType:'BONE_MARROW_ASPIRATE',
    specimenAssessment:{status:'present',specimenType:'BONE_MARROW_ASPIRATE'},
    marrowAdequacy:{status:'indeterminate'},
    myeloidSeries:{status:'present',maturation:'heterogeneous maturation with mature forms',expansionContext:{numerousGranulocyticPrecursors:true,broadMaturationSpectrum:true,matureNeutrophilicFormsPresent:true,leftShiftedMaturationSpectrum:true,denseMyeloidField:true}},
    erythroidSeries:{status:'present'},
    megakaryocyticSeries:{status:'notObserved'},
    blastAssessment:{
      status:'notObserved', observed:false, evidenceState:'NOT_OBSERVED_IN_EVALUABLE_FIELD',
      approximateBlastLikeCells:null, approximateImmatureCellCount:null,
      immatureCellBurden:'low_to_moderate_visible_in_field',
      spatialDistribution:'scattered_intermixed_with_maturing_hematopoietic_cells',
      morphologySupport:{highNCRatio:null,openFineChromatin:null,nucleoli:null,scantBasophilicCytoplasm:null,monomorphism:false,repeatedAcrossField:false},
      immatureCellCytology:{highNCRatio:null,openFineChromatin:null,nucleoli:null,scantBasophilicCytoplasm:null,morphologicallyCoherent:false,repeatedSubsetAcrossField:false,distinctFromMaturationContinuum:false},
      precursorContext:{maturationHeterogeneity:true,maturationContinuum:true,matureFormsPresent:true,lineageDiversity:true,nonMonomorphicBackground:true},
      blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false,matureFormsCoexist:true},
      immatureCellCytologyStability:{status:'reassessed',highNCRatio:null,openFineChromatin:null,nucleoli:null,scantBasophilicCytoplasm:null},
      summary:'Immature precursors are visible; no distinct blastoid population established.'
    },
    ...overrides,
  };
}
function acquire(raw){ return assessBoneMarrowVisualEvidenceAcquisition({visionResponse:raw,analysisSource:'ai_visual'}); }

test('PASS 0 — 005.50.16 fingerprints are registered',()=>{
  assert.equal(MARROW_IMMATURE_BLASTOID_CELL_LEVEL_CYTOMORPHOLOGY_ACQUISITION_RECOVERY_VERSION,'BE-FIX-005.50.16');
  assert.equal(MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_LOCK_VERSION,'BE-FIX-005.50.16');
  assert.equal(MARROW_CELL_LEVEL_CYTOMORPHOLOGY_RECOVERY_VERSION,'BE-FIX-005.50.16');
  assert.equal(MARROW_CELL_LEVEL_UNRESOLVED_IMMATURITY_CONTINUUM_GATE_VERSION,'BE-FIX-005.50.16');
});

test('PASS 1 — precursor-rich reassessed but uncharacterized immature cytology becomes unresolved cell-level evidence',()=>{
  const raw=baseMarrow(); const vme=acquire(raw);
  assert.equal(vme.immatureCellCytologyRecovery.precursorRichField,true);
  assert.equal(vme.immatureCellCytologyRecovery.cellLevelUnresolvedImmaturity,true);
  assert.equal(vme.immatureCellCytologyRecovery.cellLevelCytomorphologyState,'UNRESOLVED_IMMATURE');
});

test('PASS 2 — unresolved cell-level evidence cannot remain a hard NOT_OBSERVED state',()=>{
  const raw=baseMarrow(); const vme=acquire(raw);
  let out=applyMarrowImmatureCellCytologyRecovery({...raw,visualMorphologyEvidenceAcquisition:vme});
  assert.equal(out.marrowImmatureCellCytologyRecovery.unresolvedCandidate,true);
  assert.equal(out.blastAssessment.evidenceState,'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
  assert.equal(out.marrowImmatureCellCytologyRecovery.positiveBlastEvidenceFabricated,false);
});

test('PASS 3 — unresolved cell-level evidence blocks physiologic auto-collapse without creating blast population',()=>{
  const raw=baseMarrow(); const vme=acquire(raw);
  let out=applyMarrowImmatureCellCytologyRecovery({...raw,visualMorphologyEvidenceAcquisition:vme});
  out=applyMarrowMaturationContinuumDiscrimination(out);
  assert.equal(out.marrowMaturationContinuumDiscrimination.strongPhysiologicContinuum,false);
  assert.equal(out.marrowMaturationContinuumDiscrimination.classification,'INDETERMINATE_MATURATION_VS_BLASTOID');
  assert.equal(out.marrowMaturationContinuumDiscrimination.observedStructuredPopulation,false);
});

test('PASS 4 — resolved non-blastoid cell cytology keeps physiologic precursor control eligible',()=>{
  const raw=baseMarrow();
  raw.blastAssessment.morphologySupport={highNCRatio:false,openFineChromatin:false,nucleoli:false,scantBasophilicCytoplasm:false,monomorphism:false,repeatedAcrossField:false};
  raw.blastAssessment.immatureCellCytologyStability={status:'reassessed',highNCRatio:false,openFineChromatin:false,nucleoli:false,scantBasophilicCytoplasm:false};
  const vme=acquire(raw);
  assert.equal(vme.immatureCellCytologyRecovery.cellLevelUnresolvedImmaturity,false);
  assert.equal(vme.immatureCellCytologyRecovery.cellLevelCytomorphologyState,'RESOLVED_NON_BLASTOID');
});

test('PASS 5 — true observed population remains positive and is never downgraded to unresolved',()=>{
  const raw=baseMarrow();
  raw.blastAssessment={...raw.blastAssessment,status:'present',observed:true,evidenceState:'OBSERVED_POPULATION',approximateBlastLikeCells:8,morphologySupport:{highNCRatio:true,openFineChromatin:true,nucleoli:true,scantBasophilicCytoplasm:true,monomorphism:true,repeatedAcrossField:true},blastoidSubpopulationContext:{distinctFromMaturationContinuum:true,morphologicallyCoherent:true,repeatedSubsetAcrossField:true,matureFormsCoexist:true}};
  const vme=acquire(raw); let out=applyMarrowImmatureCellCytologyRecovery({...raw,visualMorphologyEvidenceAcquisition:vme});
  assert.equal(out.blastAssessment.evidenceState,'OBSERVED_POPULATION');
  assert.notEqual(out.marrowImmatureCellCytologyRecovery?.candidateState,'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
});

test('PASS 6 — field limitation does not turn unresolved cell evidence into population inference',()=>{
  const raw=baseMarrow({fieldAdequacy:{limitedField:true,populationInferenceAllowed:false,adequateForPopulationAssessment:false}});
  const vme=acquire(raw); let out=applyMarrowImmatureCellCytologyRecovery({...raw,visualMorphologyEvidenceAcquisition:vme});
  out=applyMarrowMaturationContinuumDiscrimination(out);
  assert.equal(out.blastAssessment.evidenceState,'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
  assert.equal(out.marrowMaturationContinuumDiscrimination.structuredPathologicSubset,false);
});

test('PASS 7 — ordinary marrow without visible immature burden does not trigger 005.50.16 fallback',()=>{
  const raw=baseMarrow();
  raw.myeloidSeries.expansionContext={broadMaturationSpectrum:true,matureNeutrophilicFormsPresent:true};
  raw.blastAssessment.immatureCellBurden='none';
  raw.blastAssessment.summary='No immature-cell burden identified in the evaluable field.';
  const vme=acquire(raw);
  assert.equal(vme.immatureCellCytologyRecovery.cellLevelUnresolvedImmaturity,false);
});
