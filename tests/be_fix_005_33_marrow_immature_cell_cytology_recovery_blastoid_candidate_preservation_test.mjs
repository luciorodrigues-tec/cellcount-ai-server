import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,
  applyMarrowImmatureCellCytologyRecovery,
  evaluateMarrowImmatureCellCytologyGap,
} from "../ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js";
import { evaluateMarrowPrecursorDiscrimination } from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";
import { assessBoneMarrowVisualEvidenceAcquisition } from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

function marrowBase(){
  return {
    specimenAssessment:{status:"present",specimenType:"HEMODILUTED_BONE_MARROW",summary:"Aspirado medular."},
    marrowAdequacy:{status:"indeterminate",summary:"Campo limitado."},
    myeloidSeries:{status:"present",maturation:"Diferentes estágios com formas maduras coexistentes.",summary:"Maturação heterogênea."},
    erythroidSeries:{status:"present",summary:"Série eritroide presente."},
    megakaryocyticSeries:{status:"notObserved",summary:"Não observada."},
    blastAssessment:{
      status:"indeterminate",evidenceState:"NOT_OBSERVED_IN_EVALUABLE_FIELD",approximateBlastLikeCells:null,
      approximateImmatureCellCount:6,immatureCellBurden:"multiple",spatialDistribution:"repeated_across_field",
      populationPattern:"heterogeneous",
      morphologySupport:{highNCRatio:null,openFineChromatin:null,nucleoli:null,scantBasophilicCytoplasm:null,monomorphism:false,repeatedAcrossField:false},
      precursorContext:{maturationHeterogeneity:true,maturationContinuum:true,matureFormsPresent:true,lineageDiversity:true,nonMonomorphicBackground:true},
      blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false,matureFormsCoexist:true},
      summary:"Múltiplas células imaturas em campo heterogêneo."
    },
    plasmaCellAssessment:{status:"indeterminate",summary:"Limitado."},
    dysplasiaAssessment:{status:"indeterminate",summary:"Limitado."},
    infiltrationAssessment:{status:"indeterminate",summary:"Limitado."}
  };
}

test("PASS 0 — 005.33 identity is registered",()=>assert.equal(MARROW_IMMATURE_CELL_CYTOLOGY_RECOVERY_VERSION,"BE-FIX-005.33"));
test("PASS 1 — multiple repeated immature cells with uncharacterized cytology trigger recovery",()=>{
  const e=evaluateMarrowImmatureCellCytologyGap(marrowBase()); assert.equal(e.unresolvedCandidate,true); assert.equal(e.immatureCount,6);
});
test("PASS 2 — unresolved candidate is preserved instead of converted to zero",()=>{
  const i=marrowBase(); i.blastAssessment.approximateBlastLikeCells=0; const o=applyMarrowImmatureCellCytologyRecovery(i);
  assert.equal(o.blastAssessment.approximateBlastLikeCells,null);
  assert.equal(o.blastAssessment.evidenceState,"IMMATURE_POPULATION_REQUIRES_DISCRIMINATION");
});
test("PASS 3 — 005.27.2 cannot auto-collapse unresolved candidate to physiologic",()=>{
  const r=applyMarrowImmatureCellCytologyRecovery(marrowBase());
  const d=evaluateMarrowPrecursorDiscrimination({specimenType:"HEMODILUTED_BONE_MARROW",blastAssessment:r.blastAssessment,rawResponse:r,myeloidSeries:r.myeloidSeries,erythroidSeries:r.erythroidSeries});
  assert.equal(d.unresolvedImmatureCandidate,true); assert.equal(d.classification,"INDETERMINATE_PRECURSOR_VS_BLAST");
  assert.equal(d.suppressBlastPromotion,false); assert.equal(d.capBlastPromotionAtIndeterminate,true);
});
test("PASS 4 — 005.33 never fabricates a positive blast population",()=>{
  const o=applyMarrowImmatureCellCytologyRecovery(marrowBase());
  assert.equal(["OBSERVED_POPULATION","SUSPICIOUS_POPULATION","FOCAL_SUSPICION"].includes(o.blastAssessment.evidenceState),false);
  assert.equal(o.marrowImmatureCellCytologyRecovery.positiveBlastEvidenceFabricated,false);
});
test("PASS 5 — directly positive blast cytology remains protected",()=>{
  const i=marrowBase(); Object.assign(i.blastAssessment,{evidenceState:"SUSPICIOUS_POPULATION",approximateBlastLikeCells:5});
  i.blastAssessment.morphologySupport.openFineChromatin=true; i.blastAssessment.morphologySupport.nucleoli=true;
  const o=applyMarrowImmatureCellCytologyRecovery(i); assert.equal(o.marrowImmatureCellCytologyRecovery.directPositiveProtected,true);
  assert.equal(o.blastAssessment.evidenceState,"SUSPICIOUS_POPULATION");
});
test("PASS 6 — physiologic marrow without repeated immature burden is not destabilized",()=>{
  const i=marrowBase(); i.blastAssessment.approximateImmatureCellCount=1;i.blastAssessment.immatureCellBurden="isolated";i.blastAssessment.spatialDistribution="isolated";
  const o=applyMarrowImmatureCellCytologyRecovery(i);assert.equal(o.marrowImmatureCellCytologyRecovery.unresolvedCandidate,false);
});
test("PASS 7 — VME requests targeted reacquisition for immature cytology gap",()=>{
  const a=assessBoneMarrowVisualEvidenceAcquisition({visionResponse:marrowBase(),analysisSource:"ai_visual"});
  assert.equal(a.immatureCellCytologyRecoveryRequired,true);assert.equal(a.retryRecommended,true);
  assert.ok(a.missingRequirements.includes("blastAssessment.immatureCellCytology"));
});
test("PASS 8 — repair prompt requires focal cytologic/subpopulation discrimination",()=>{
  const s=fs.readFileSync(new URL("../ai/visualMorphologyEvidenceAcquisitionContract.js",import.meta.url),"utf8");
  assert.match(s,/BE-FIX-005\.33 — DISCRIMINAÇÃO FOCAL DE CÉLULAS IMATURAS/);
  assert.match(s,/distinctFromMaturationContinuum/);assert.match(s,/morphologicallyCoherent/);
});
test("PASS 9 — server authorizes 005.33 repair and applies recovery before LME",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  assert.match(s,/immatureCellCytologyRecoveryRequired/);assert.match(s,/applyMarrowImmatureCellCytologyRecovery\(parsed\)/);
  assert.ok(s.indexOf("applyMarrowImmatureCellCytologyRecovery(parsed)")<s.indexOf("createLocalMorphologyEvidence({"));
});
