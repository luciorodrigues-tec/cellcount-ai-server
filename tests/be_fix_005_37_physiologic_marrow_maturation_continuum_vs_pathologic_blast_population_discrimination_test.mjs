import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateMarrowMaturationContinuum,
  applyMarrowMaturationContinuumDiscrimination,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";
import { evaluateMarrowPositiveCytologyDiscordance } from "../ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";
import { readRecoveredMarrowBlastEvidence } from "../ai/boneMarrow/marrowRecoveredCytologyProjectionEngine.js";
import { evaluateMarrowPrecursorDiscrimination } from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";

function physiologic(){
  return {
    specimenAssessment:{specimenType:"BONE_MARROW_ASPIRATE"},
    marrowAdequacy:{status:"limited"},
    myeloidSeries:{maturation:"Maturação progressiva com diferentes estágios e formas maduras.",summary:"Heterogeneidade maturativa preservada."},
    erythroidSeries:{maturation:"Série eritroide presente em diferentes estágios."},
    blastAssessment:{
      evidenceState:"positiveLimitedMorphologicEvidence",
      approximateImmatureCellCount:8,
      approximateBlastLikeCells:3,
      populationPattern:"heterogeneous",
      morphologySupport:{highNCRatio:false,openFineChromatin:true,nucleoli:false,scantBasophilicCytoplasm:false,monomorphism:false,repeatedAcrossField:false},
      immatureCellCytology:{openFineChromatin:true,highNCRatio:false,nucleoli:false,scantBasophilicCytoplasm:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false,distinctFromMaturationContinuum:false},
      blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false,repeatedCellsWithSimilarFeatures:false},
      precursorContext:{maturationHeterogeneity:true,maturationContinuum:true,matureFormsPresent:true,lineageDiversity:true,nonMonomorphicBackground:true}
    }
  };
}
function truePositive(){
  const i=physiologic();
  i.blastAssessment={
    ...i.blastAssessment,
    evidenceState:"SUSPICIOUS_POPULATION",
    observed:true,
    populationPattern:"repeated",
    morphologySupport:{highNCRatio:true,openFineChromatin:true,nucleoli:true,scantBasophilicCytoplasm:true,monomorphism:true,repeatedAcrossField:true},
    blastoidSubpopulationContext:{distinctFromMaturationContinuum:true,morphologicallyCoherent:true,repeatedSubsetAcrossField:true,repeatedCellsWithSimilarFeatures:true,coherentBlastoidSubsetObserved:true}
  };
  return i;
}
test("PASS 0 — physiologic maturation continuum is recognized",()=>{
  const e=evaluateMarrowMaturationContinuum(physiologic());
  assert.equal(e.strongPhysiologicContinuum,true);
  assert.equal(e.falseBlastPromotionRisk,true);
});
test("PASS 1 — isolated open chromatin does not defeat strong marrow continuum",()=>{
  const e=evaluateMarrowMaturationContinuum(physiologic());
  assert.equal(e.cytologyScore,1); assert.ok(e.architectureScore<3);
  assert.equal(e.classification,"PHYSIOLOGIC_MATURATION_CONTINUUM");
});
test("PASS 2 — false positiveLimitedMorphologicEvidence is contained",()=>{
  const o=applyMarrowMaturationContinuumDiscrimination(physiologic());
  assert.equal(o.blastAssessment.evidenceState,"PHYSIOLOGIC_PRECURSOR_PATTERN");
  assert.equal(o.marrowPhysiologicMaturationContinuumLock.active,true);
});
test("PASS 3 — containment does not create a blast-negative exclusion",()=>{
  const o=applyMarrowMaturationContinuumDiscrimination(physiologic());
  assert.equal(o.marrowPhysiologicMaturationContinuumLock.negativeBlastExclusionAllowed,false);
  assert.equal(o.blastAssessment.globalAbsenceAllowed,false);
});
test("PASS 4 — 005.35 does not reopen unresolved blastoid cytology over physiologic lock",()=>{
  const o=applyMarrowMaturationContinuumDiscrimination(physiologic());
  const e=evaluateMarrowPositiveCytologyDiscordance(o);
  assert.equal(e.physiologicContinuumLock,true);
  assert.equal(e.unresolvedPositiveCytology,false);
});
test("PASS 5 — 005.34 cannot project a positive E2E lock over physiologic continuum",()=>{
  const o=applyMarrowMaturationContinuumDiscrimination(physiologic());
  const e=readRecoveredMarrowBlastEvidence(o);
  assert.equal(e.physiologicContinuumLock,true);
  assert.equal(e.structuredPositive,false);
});
test("PASS 6 — 005.27 recognizes the protected physiologic continuum",()=>{
  const o=applyMarrowMaturationContinuumDiscrimination(physiologic());
  const d=evaluateMarrowPrecursorDiscrimination(o);
  assert.equal(d.physiologicContinuumProtected,true);
  assert.equal(d.classification,"PHYSIOLOGIC_PRECURSOR_PATTERN");
});
test("PASS 7 — true distinct coherent repeated blastoid subset is never suppressed",()=>{
  const e=evaluateMarrowMaturationContinuum(truePositive());
  assert.equal(e.structuredPathologicSubset,true);
  assert.equal(e.falseBlastPromotionRisk,false);
  const o=applyMarrowMaturationContinuumDiscrimination(truePositive());
  assert.equal(o.blastAssessment.evidenceState,"SUSPICIOUS_POPULATION");
  assert.equal(o.marrowPhysiologicMaturationContinuumLock,undefined);
});
test("PASS 8 — heterogeneity alone cannot suppress a structured true positive",()=>{
  const e=evaluateMarrowMaturationContinuum(truePositive());
  assert.equal(e.structuredPathologicSubset,true);
  assert.equal(e.classification,"PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED");
});
test("PASS 9 — server exposes 005.37 runtime and applies it before 005.33/005.35/005.34",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  const p=s.indexOf("applyMarrowMaturationContinuumDiscrimination(parsed)");
  assert.ok(p>0);
  assert.ok(p<s.indexOf("applyMarrowImmatureCellCytologyRecovery(parsed)"));
  assert.ok(p<s.indexOf("applyMarrowPositiveCytologyConsistency(parsed)"));
  assert.ok(p<s.indexOf("applyMarrowRecoveredCytologyProjection(parsed)"));
  assert.match(s,/marrowMaturationContinuumDiscriminationVersion/);
  assert.match(s,/marrowPhysiologicImmaturityContainmentVersion/);
});
