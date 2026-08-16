import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  applyMarrowRecoveredCytologyProjection,
  readRecoveredMarrowBlastEvidence,
} from "../ai/boneMarrow/marrowRecoveredCytologyProjectionEngine.js";
import { evaluateFieldAdequacy } from "../ai/fieldAdequacyEngine.js";
import { analyzeGlobalPattern } from "../ai/globalPatternEngine.js";
import { evaluateMarrowImmatureCellCytologyGap } from "../ai/boneMarrow/marrowImmatureCellCytologyRecoveryEngine.js";

function productionRepairShape(){
  return {
    specimenAssessment:{specimenType:"HEMODILUTED_BONE_MARROW"},
    marrowAdequacy:{status:"limited"},
    blastAssessment:{
      evidenceState:"limitedButPositiveForImmatureBlastLikeCells",
      approximateBlastLikeCellCountInProvidedFields:4,
      morphologicFeatureCount:5,
      populationPattern:"repeatedSubsetAcrossField",
      immatureCellCytology:{
        highNCRatio:true,openFineChromatin:true,nucleoli:true,
        scantBasophilicCytoplasm:true,monomorphism:"partial",
        morphologicallyCoherent:true,repeatedSubsetAcrossField:true
      },
      blastoidSubpopulationContext:{
        coherentBlastoidSubsetObserved:true,
        repeatedCellsWithSimilarFeatures:true,
        morphologicallyCoherent:true,
        repeatedSubsetAcrossField:true
      }
    }
  };
}
test("PASS 0 — production repair schema is recognized as positive",()=>{
  const e=readRecoveredMarrowBlastEvidence(productionRepairShape());
  assert.equal(e.structuredPositive,true); assert.equal(e.blastLikeCount,4); assert.equal(e.positiveCytologyCount,4);
});
test("PASS 1 — 005.33 reader no longer returns zero cytology on recovered schema",()=>{
  const e=evaluateMarrowImmatureCellCytologyGap(productionRepairShape());
  assert.equal(e.blastLikeCount,4); assert.equal(e.positiveCytologyCount,4); assert.equal(e.directPositiveProtected,true);
});
test("PASS 2 — recovered evidence projects into canonical blastAssessment",()=>{
  const o=applyMarrowRecoveredCytologyProjection(productionRepairShape());
  assert.equal(o.blastAssessment.approximateBlastLikeCells,4);
  assert.equal(o.blastAssessment.evidenceState,"limitedButPositiveForImmatureBlastLikeCells");
  assert.equal(o.blastAssessment.observed,true);
});
test("PASS 3 — positive E2E lock is asserted",()=>{
  const o=applyMarrowRecoveredCytologyProjection(productionRepairShape());
  assert.equal(o.marrowPositiveBlastEvidenceLock.active,true);
  assert.equal(o.findings.immatureCells,true); assert.equal(o.findings.blastSuspicion,true);
});
test("PASS 4 — FA-4.0 treats 005.34 as positive despite limited negative assessability",()=>{
  const o=applyMarrowRecoveredCytologyProjection(productionRepairShape());
  o.fieldAdequacy={adequateForBlastScreening:false,visibleLeukocytes:2};
  const f=evaluateFieldAdequacy(o);
  assert.equal(f.blastAssessability.positiveEvidencePresent,true);
  assert.equal(f.blastAssessability.positiveEvidencePreserved,true);
});
test("PASS 5 — global pattern preserves recovered positive marrow evidence",()=>{
  const o=applyMarrowRecoveredCytologyProjection(productionRepairShape());
  o.fieldAdequacy={limitedField:true,adequateForPopulationAssessment:false};
  const g=analyzeGlobalPattern(o);
  assert.equal(g.marrowPositiveBlastEvidence,true);
  assert.equal(g.dominantPattern,"MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN");
  assert.equal(g.blastAssessmentState,"POSITIVE_EVIDENCE_PRESERVED");
});
test("PASS 6 — 005.34 does not invent positivity from physiologic marrow",()=>{
  const i=productionRepairShape(); i.blastAssessment={
    evidenceState:"NOT_OBSERVED_IN_EVALUABLE_FIELD",approximateBlastLikeCellCountInProvidedFields:0,
    immatureCellCytology:{highNCRatio:false,openFineChromatin:false,nucleoli:false,scantBasophilicCytoplasm:false},
    blastoidSubpopulationContext:{coherentBlastoidSubsetObserved:false,repeatedCellsWithSimilarFeatures:false}
  };
  const o=applyMarrowRecoveredCytologyProjection(i);
  assert.equal(o.marrowRecoveredCytologyProjection.structuredPositive,false);
  assert.equal(o.marrowPositiveBlastEvidenceLock,undefined);
});
test("PASS 7 — field limitation remains a negative-only gate",()=>{
  const o=applyMarrowRecoveredCytologyProjection(productionRepairShape());
  o.fieldAdequacy={adequateForBlastScreening:false,visibleLeukocytes:1};
  const f=evaluateFieldAdequacy(o);
  assert.equal(f.blastAssessability.negativeBlastConclusionAllowed,false);
  assert.equal(f.blastAssessability.positiveEvidencePresent,true);
});
test("PASS 8 — server applies 005.34 before LME capture",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  assert.ok(s.indexOf("applyMarrowRecoveredCytologyProjection(parsed)") < s.indexOf("createLocalMorphologyEvidence({"));
});
test("PASS 9 — runtime fingerprints and downstream engines expose 005.34",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  const f=fs.readFileSync(new URL("../ai/fieldAdequacyEngine.js",import.meta.url),"utf8");
  const g=fs.readFileSync(new URL("../ai/globalPatternEngine.js",import.meta.url),"utf8");
  assert.match(s,/marrowRecoveredCytologyProjectionVersion/);
  assert.match(s,/marrowPositiveBlastE2ELockVersion/);
  assert.match(f,/marrowPositiveBlastEvidenceLock/); assert.match(g,/marrowPositiveBlastEvidenceLock/);
});
