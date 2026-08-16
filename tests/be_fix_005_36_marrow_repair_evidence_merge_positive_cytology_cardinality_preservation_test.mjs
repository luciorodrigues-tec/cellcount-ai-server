import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  mergeVisualMorphologyRepair,
  MARROW_REPAIR_EVIDENCE_MERGE_VERSION,
  MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION,
  assessBoneMarrowVisualEvidenceAcquisition,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

function initial(){
  return {
    specimenAssessment:{status:"present",specimenType:"BONE_MARROW_ASPIRATE"},
    marrowAdequacy:{status:"indeterminate"},
    myeloidSeries:{status:"present"},
    erythroidSeries:{status:"present"},
    megakaryocyticSeries:{status:"notObserved"},
    blastAssessment:{
      evidenceState:"NOT_ASSESSABLE",
      approximateBlastLikeCells:null,
      approximateImmatureCellCount:6,
      immatureCellBurden:"multiple",
      spatialDistribution:"repeated_across_field",
      morphologySupport:{
        highNCRatio:null,
        openFineChromatin:null,
        nucleoli:null,
        scantBasophilicCytoplasm:null,
        repeatedAcrossField:false
      },
      blastoidSubpopulationContext:{
        distinctFromMaturationContinuum:null,
        morphologicallyCoherent:null,
        repeatedSubsetAcrossField:false
      }
    }
  };
}
function repair(){
  return {
    specimenAssessment:{},
    marrowAdequacy:{status:"indeterminate"},
    blastAssessment:{
      evidenceState:"positiveLimitedMorphologicEvidence",
      approximateBlastLikeCells:4,
      approximateImmatureCellCount:null,
      immatureCellBurden:null,
      spatialDistribution:null,
      morphologicFeatureCount:4,
      immatureCellCytology:{
        highNCRatio:true,
        openFineChromatin:true,
        nucleoli:true,
        scantBasophilicCytoplasm:true,
        morphologicallyCoherent:true,
        repeatedSubsetAcrossField:true
      },
      blastoidSubpopulationContext:{
        morphologicallyCoherent:true,
        repeatedSubsetAcrossField:true,
        repeatedCellsWithSimilarFeatures:true
      }
    }
  };
}
test("PASS 0 — 005.36 identities are registered",()=>{
  assert.equal(MARROW_REPAIR_EVIDENCE_MERGE_VERSION,"BE-FIX-005.36");
  assert.equal(MARROW_POSITIVE_CYTOLOGY_CARDINALITY_PRESERVATION_VERSION,"BE-FIX-005.36");
});
test("PASS 1 — repair cannot erase initial immature-cell count",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.blastAssessment.approximateImmatureCellCount,6);
  assert.equal(m.marrowRepairEvidenceMerge.finalImmatureCellCount,6);
});
test("PASS 2 — multiple immature burden survives a cytology-focused repair",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.blastAssessment.immatureCellBurden,"multiple");
  assert.equal(m.marrowRepairEvidenceMerge.multipleImmaturePreserved,true);
});
test("PASS 3 — repeated immature evidence survives repair nulls",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.match(m.blastAssessment.spatialDistribution,/repeated/i);
  assert.equal(m.marrowRepairEvidenceMerge.repeatedImmaturePreserved,true);
});
test("PASS 4 — positive repair cytology enriches rather than replaces initial evidence",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.blastAssessment.immatureCellCytology.highNCRatio,true);
  assert.equal(m.blastAssessment.immatureCellCytology.openFineChromatin,true);
  assert.equal(m.blastAssessment.immatureCellCytology.nucleoli,true);
  assert.equal(m.blastAssessment.immatureCellCytology.scantBasophilicCytoplasm,true);
});
test("PASS 5 — positive repair blast-like cardinality is retained",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.blastAssessment.approximateBlastLikeCells,4);
  assert.equal(m.blastAssessment.morphologicFeatureCount,4);
});
test("PASS 6 — empty repair specimenAssessment cannot erase validated specimen context",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.specimenAssessment.specimenType,"BONE_MARROW_ASPIRATE");
  assert.equal(m.marrowRepairEvidenceMerge.specimenAssessmentPreserved,true);
});
test("PASS 7 — empty/truncated repair object cannot convert prior evidence to zeroEvidence",()=>{
  const m=mergeVisualMorphologyRepair(initial(),{});
  const a=assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse:m,
    analysisSource:"ai_visual"
  });
  assert.equal(a.zeroEvidence,false);
  assert.equal(a.immatureCellCytologyRecovery.approximateImmatureCellCount,6);
});
test("PASS 8 — positive repair state outranks first-pass NOT_ASSESSABLE",()=>{
  const m=mergeVisualMorphologyRepair(initial(),repair());
  assert.equal(m.blastAssessment.evidenceState,"positiveLimitedMorphologicEvidence");
  assert.equal(m.marrowRepairEvidenceMerge.repairEvidenceState,"positiveLimitedMorphologicEvidence");
});
test("PASS 9 — server exposes 005.36 runtime fingerprints and merge logging",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  assert.match(s,/marrowRepairEvidenceMergeVersion/);
  assert.match(s,/marrowPositiveCytologyCardinalityPreservationVersion/);
  assert.match(s,/BE-FIX-005\.36 — MARROW REPAIR EVIDENCE MERGE/);
});
