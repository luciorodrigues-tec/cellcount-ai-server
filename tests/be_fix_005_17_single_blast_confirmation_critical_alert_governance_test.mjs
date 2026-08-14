import test from "node:test";
import assert from "node:assert/strict";
import { applySingleBlastSentinel, SINGLE_BLAST_SENTINEL_VERSION, SINGLE_BLAST_CONFIRMATION_GOVERNANCE_VERSION } from "../ai/singleBlastSentinel.js";
import applyFinalClinicalGovernor from "../ai/finalClinicalGovernor.js";
import { createLocalMorphologyEvidence } from "../ai/localMorphologyEvidenceContract.js";

function base() {
  return {
    fieldAdequacy: { limitedField:true, adequateForPopulationAssessment:false, populationInferenceAllowed:false, adequateForBlastScreening:false, blastAssessability:{adequateForBlastScreening:false} },
    findings: {}, overallAssessment:{}, morphologyAnalysis:{}, structuredReport:{},
    localMorphologyEvidence: { contractVersion:"LME-1.0", evidenceAvailable:true, leukocytes:{description:"Célula nucleada visível."}, criticalMorphology:{ blastLikeMorphology:"NOT_ASSESSABLE", blastAssessability:{adequateForBlastScreening:false} } },
  };
}

test("PASS 0 — 005.13 sentinel identity and 005.17 governance are both registered", () => {
  assert.equal(SINGLE_BLAST_SENTINEL_VERSION, "BE-FIX-005.13");
  assert.equal(SINGLE_BLAST_CONFIRMATION_GOVERNANCE_VERSION, "BE-FIX-005.17");
});

test("PASS 1 — one observed blast-like cell triggers CRITICAL alert even in limited field",()=>{
  const r=base(); r.localMorphologyEvidence.criticalMorphology.blastLikeMorphology="OBSERVED"; r.localMorphologyEvidence.criticalMorphology.observedBlastLikeCount=1;
  const out=applySingleBlastSentinel(r);
  assert.equal(out.singleBlastSentinel.alertLevel,"CRITICAL"); assert.equal(out.singleBlastSentinel.confirmedMorphologicObservation,true); assert.equal(out.finalClassification,"CLASS_4_BLAST_SUSPICION"); assert.equal(out.requiresHumanReview,true);
});

test("PASS 2 — suspicion is HIGH priority but not morphologic confirmation",()=>{
  const r=base(); r.localMorphologyEvidence.criticalMorphology.blastLikeMorphology="SUSPICIOUS_INDETERMINATE";
  const out=applySingleBlastSentinel(r);
  assert.equal(out.singleBlastSentinel.alertLevel,"HIGH"); assert.equal(out.singleBlastSentinel.confirmedMorphologicObservation,false); assert.match(out.mainFinding,/suspeita|suspeito/i);
});

test("PASS 3 — reactive flags cannot suppress observed blast evidence in final governor",()=>{
  const r=base(); r.findings={reactiveLymphocytes:true,mononucleosisSuspicion:true,blastSuspicion:true,blastEvidenceState:"OBSERVED",immatureCells:true}; r.localMorphologyEvidence.criticalMorphology.blastLikeMorphology="OBSERVED"; r.localMorphologyEvidence.criticalMorphology.observedBlastLikeCount=1;
  const out=applyFinalClinicalGovernor(r); assert.equal(out.finalClassification,"CLASS_4_BLAST_SUSPICION"); assert.match(out.riskLevel,/CRÍTICO|CRITICO/i);
});

test("PASS 4 — blastSuspicion=true alone becomes SUSPICIOUS, never OBSERVED in LME",()=>{
  const lme=createLocalMorphologyEvidence({visionResponse:{ findings:{blastSuspicion:true}, fieldAdequacy:{adequateForBlastScreening:false}, observedMorphology:{globalField:"Campo limitado",erythrocytes:{description:"Hemácias visíveis"},leukocytes:{description:"Célula mononuclear atípica"},platelets:{description:"Plaquetas visíveis"}} }});
  assert.equal(lme.criticalMorphology.blastLikeMorphology,"SUSPICIOUS_INDETERMINATE");
});

test("PASS 5 — explicit observedBlastLikeCount confirms OBSERVED state",()=>{
  const lme=createLocalMorphologyEvidence({visionResponse:{ localMorphologyEvidence:{criticalMorphology:{blastEvidenceState:"OBSERVED",observedBlastLikeCount:1}}, findings:{blastSuspicion:true}, fieldAdequacy:{adequateForBlastScreening:false}, observedMorphology:{globalField:"Campo limitado",erythrocytes:{description:"Hemácias visíveis"},leukocytes:{description:"Blastoide observado"},platelets:{description:"Plaquetas visíveis"}} }});
  assert.equal(lme.criticalMorphology.blastLikeMorphology,"OBSERVED"); assert.equal(lme.criticalMorphology.observedBlastLikeCount,1);
});

test("PASS 6 — not assessable remains not assessable and never becomes a negative",()=>{
  const r=base(); const out=applySingleBlastSentinel(r); assert.equal(out.singleBlastSentinel.negativeEvidenceState,"NOT_ASSESSABLE"); assert.equal(out.singleBlastSentinel.negativeBlastConclusionAllowed,false);
});
