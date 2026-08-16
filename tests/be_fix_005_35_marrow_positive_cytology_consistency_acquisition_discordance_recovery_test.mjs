import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  evaluateMarrowPositiveCytologyDiscordance,
  applyMarrowPositiveCytologyConsistency,
} from "../ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";
import { assessBoneMarrowVisualEvidenceAcquisition } from "../ai/visualMorphologyEvidenceAcquisitionContract.js";
import { evaluateMarrowPrecursorDiscrimination } from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";

function discordant(){
  return {
    specimenAssessment:{specimenType:"BONE_MARROW_ASPIRATE"},
    marrowAdequacy:{status:"limited"},
    myeloidSeries:{status:"present",summary:"Múltiplas células imaturas repetidas no campo."},
    erythroidSeries:{status:"present"},megakaryocyticSeries:{status:"present"},
    blastAssessment:{
      evidenceState:"NOT_ASSESSABLE",
      approximateImmatureCellCount:6,
      immatureCellBurden:"multiple",
      spatialDistribution:"repeated across_field",
      morphologySupport:{highNCRatio:false,openFineChromatin:true,nucleoli:false,scantBasophilicCytoplasm:false,repeatedAcrossField:false},
      blastoidSubpopulationContext:{distinctFromMaturationContinuum:false,morphologicallyCoherent:false,repeatedSubsetAcrossField:false},
      summary:"Múltiplas células imaturas repetidas, com cromatina aberta em parte delas."
    },
    visualMorphologyEvidenceAcquisition:{
      specimenScope:"BONE_MARROW",complete:true,
      immatureCellCytologyRecovery:{multipleImmatureCells:true,repeatedImmatureCells:true,characterizedBlastCytologyCount:1,positiveBlastCytologyCount:1,approximateImmatureCellCount:6},
      acquiredDomains:{narrativeMentionsRepeatedImmature:true,structuredRepeat:false,narrativeStructuredDiscordance:true}
    }
  };
}
test("PASS 0 — 005.35 detects the production discordance signature",()=>{
  const e=evaluateMarrowPositiveCytologyDiscordance(discordant());
  assert.equal(e.unresolvedPositiveCytology,true); assert.equal(e.positiveCytologyCount,1);
});
test("PASS 1 — unresolved positive cytology is preserved without fabricating blasts",()=>{
  const o=applyMarrowPositiveCytologyConsistency(discordant());
  assert.equal(o.blastAssessment.evidenceState,"UNRESOLVED_BLASTOID_CYTOLOGY");
  assert.equal(o.marrowPositiveCytologyConsistency.positiveBlastPopulationFabricated,false);
});
test("PASS 2 — zero blast-like count cannot resolve discordant positive cytology",()=>{
  const i=discordant(); i.blastAssessment.approximateBlastLikeCells=0;
  const o=applyMarrowPositiveCytologyConsistency(i);
  assert.equal(o.blastAssessment.approximateBlastLikeCells,null);
});
test("PASS 3 — 005.27.2 cannot auto-collapse unresolved cytology to physiologic",()=>{
  const o=applyMarrowPositiveCytologyConsistency(discordant());
  const d=evaluateMarrowPrecursorDiscrimination(o);
  assert.equal(d.unresolvedPositiveCytology,true);
  assert.notEqual(d.classification,"PHYSIOLOGIC_PRECURSOR_PATTERN");
  assert.equal(d.suppressBlastPromotion,false);
});
test("PASS 4 — VME requires focal repair for positive cytology narrative/structure discordance",()=>{
  const i=discordant(); delete i.visualMorphologyEvidenceAcquisition;
  const a=assessBoneMarrowVisualEvidenceAcquisition({visionResponse:i,analysisSource:"ai_visual"});
  assert.equal(a.immatureCellCytologyRecoveryRequired,true);
  assert.equal(a.complete,false);
  assert.equal(a.immatureCellCytologyRecovery.positiveCytologyDiscordanceRecoveryRequired,true);
});
test("PASS 5 — physiologic marrow with no positive cytology is not destabilized",()=>{
  const i=discordant();
  i.visualMorphologyEvidenceAcquisition.immatureCellCytologyRecovery.positiveBlastCytologyCount=0;
  i.blastAssessment.morphologySupport.openFineChromatin=false;
  const e=evaluateMarrowPositiveCytologyDiscordance(i);
  assert.equal(e.unresolvedPositiveCytology,false);
});
test("PASS 6 — structured true positive remains positive and is not downgraded",()=>{
  const i=discordant();
  i.blastAssessment.evidenceState="SUSPICIOUS_POPULATION";
  i.blastAssessment.blastoidSubpopulationContext={distinctFromMaturationContinuum:true,morphologicallyCoherent:true,repeatedSubsetAcrossField:true};
  const o=applyMarrowPositiveCytologyConsistency(i);
  assert.equal(o.marrowPositiveCytologyConsistency.structuredPositive,true);
  assert.equal(o.blastAssessment.evidenceState,"SUSPICIOUS_POPULATION");
});
test("PASS 7 — one isolated feature without repeated immature population does not trigger 005.35",()=>{
  const i=discordant();
  i.visualMorphologyEvidenceAcquisition.immatureCellCytologyRecovery.repeatedImmatureCells=false;
  i.visualMorphologyEvidenceAcquisition.acquiredDomains.narrativeMentionsRepeatedImmature=false;
  i.blastAssessment.spatialDistribution="isolated";
  const e=evaluateMarrowPositiveCytologyDiscordance(i);
  assert.equal(e.unresolvedPositiveCytology,false);
});
test("PASS 8 — server applies 005.35 after 005.33 and before 005.34/LME",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  const p35=s.indexOf("applyMarrowPositiveCytologyConsistency(parsed)");
  assert.ok(p35>s.indexOf("applyMarrowImmatureCellCytologyRecovery(parsed)"));
  assert.ok(p35<s.indexOf("applyMarrowRecoveredCytologyProjection(parsed)"));
  assert.ok(p35<s.indexOf("createLocalMorphologyEvidence({"));
});
test("PASS 9 — runtime fingerprints and VME expose 005.35",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  const v=fs.readFileSync(new URL("../ai/visualMorphologyEvidenceAcquisitionContract.js",import.meta.url),"utf8");
  assert.match(s,/marrowPositiveCytologyConsistencyVersion/);
  assert.match(s,/marrowAcquisitionDiscordanceRecoveryVersion/);
  assert.match(v,/positiveCytologyConsistencyVersion: "BE-FIX-005.35"/);
});
