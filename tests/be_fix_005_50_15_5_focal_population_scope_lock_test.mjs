import assert from "node:assert/strict";
import { evaluateMarrowPositiveCytologyDiscordance } from "../ai/boneMarrow/marrowPositiveCytologyConsistencyEngine.js";
import { evaluateMarrowPositiveBlastEvidenceSemanticSupersession } from "../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js";
import { evaluateFinalMarrowAuthority } from "../ai/boneMarrow/marrowFinalClinicalAuthorityEngine.js";
import { evaluateMarrowMorphologyAdequacyProjectionLock } from "../ai/boneMarrow/marrowMorphologyAdequacyProjectionLockEngine.js";

function base(){
  return {
    specimenType:"BONE_MARROW",
    fieldAdequacy:{limitedField:true,adequateForPopulationAssessment:false,populationInferenceAllowed:false,globalNegativeExclusionAllowed:false},
    blastAssessment:{evidenceState:"FOCAL_SUSPICION",approximateBlastLikeCells:1,approximateImmatureCellCount:4,
      immatureCellCytology:{highNCRatio:true,openFineChromatin:null,nucleoli:null,scantBasophilicCytoplasm:null,repeatedSubsetAcrossField:true}},
    localMorphologyEvidence:{marrow:{blastPopulationEvidence:{evidenceState:"FOCAL_SUSPICION",positive:true,repeated:false,approximateBlastLikeCells:1}}},
    visualMorphologyEvidenceAcquisition:{immatureCellCytologyRecovery:{multipleImmatureCells:true,repeatedImmatureCells:true,characterizedBlastCytologyCount:1,positiveBlastCytologyCount:1}},
  };
}

let r=base();
let c=evaluateMarrowPositiveCytologyDiscordance(r);
assert.equal(c.focalSuspicionState,true);
assert.equal(c.positivePopulationState,false);
assert.equal(c.structuredPositive,false);
console.log("PASS 1 — FOCAL_SUSPICION is not structured-positive by state alone");

let s=evaluateMarrowPositiveBlastEvidenceSemanticSupersession(r);
assert.equal(s.populationInferenceAllowed,false);
assert.equal(s.focalPopulationScopeBlocked,true);
assert.equal(s.populationPositiveAllowed,false);
console.log("PASS 2 — focal cytology cannot authorize population positivity in limited field");

let a=evaluateFinalMarrowAuthority(r);
assert.equal(a.structuredBlast.focalOnly,true);
assert.equal(a.structuredBlast.populationInferenceAllowed,false);
assert.equal(a.structuredBlast.structured,false);
assert.equal(a.structuredBlast.populationPositiveAllowed,false);
console.log("PASS 3 — final authority does not resurrect focal evidence as structured population");

r=base();
r.marrowBlastPopulationEvidence={evidenceState:"OBSERVED_POPULATION",observedPopulation:true};
a=evaluateFinalMarrowAuthority(r);
assert.equal(a.structuredBlast.observed,true);
assert.equal(a.structuredBlast.structured,true);
assert.equal(a.structuredBlast.populationPositiveAllowed,true);
console.log("PASS 4 — true OBSERVED_POPULATION remains protected despite limited representativity");

r=base();
r.marrowBlastPopulationEvidence={evidenceState:"SUSPICIOUS_POPULATION",suspiciousPopulation:true};
r.marrowPrecursorDiscrimination={protectedSuspiciousBlastoid:true,architectureProvenanceQualified:true};
a=evaluateFinalMarrowAuthority(r);
assert.equal(a.structuredBlast.suspicious,true);
assert.equal(a.structuredBlast.structured,true);
console.log("PASS 5 — qualified SUSPICIOUS_POPULATION remains protected");

r=base();
r.finalMarrowAuthority={structuredBlast:{focalOnly:true,observed:false,suspicious:false,structured:false},morphologyClassification:"MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",applyExpansionAuthority:true};
r.marrowAdequacyMorphologyAxis={morphologyClassification:"MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",adequacyClassification:"CLASS_1_LIMITED_FIELD"};
r.marrowMyeloidExpansionDiscrimination={classification:"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",pathologicMyeloidExpansionSupported:true};
let p=evaluateMarrowMorphologyAdequacyProjectionLock(r);
assert.equal(p.populationInferenceAllowed,false);
assert.equal(p.focalCytologyPopulationScopeLocked,true);
assert.equal(p.populationPositiveAllowed,false);
console.log("PASS 6 — projection lock preserves morphology while blocking focal-to-population promotion");

console.log("BE-FIX-005.50.15.5: PASS 1-6");
