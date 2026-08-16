import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evaluateMarrowMyeloidExpansion,
  applyMarrowMyeloidExpansionDiscrimination,
  MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,
  MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION,
} from "../ai/boneMarrow/marrowMyeloidExpansionDiscriminationEngine.js";

import {
  evaluateMarrowMaturationContinuum,
  applyMarrowMaturationContinuumDiscrimination,
} from "../ai/boneMarrow/marrowMaturationContinuumDiscriminationEngine.js";

import {
  evaluateMarrowPrecursorDiscrimination,
} from "../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js";

import {
  applyMarrowPhysiologicPrecursorCoherence,
} from "../ai/boneMarrow/marrowPhysiologicPrecursorCoherenceEngine.js";

function normalMarrow() {
  return {
    specimenAssessment:{specimenType:"BONE_MARROW_ASPIRATE"},
    marrowAdequacy:{status:"limited"},
    myeloidSeries:{
      status:"present",
      maturation:"Maturação progressiva com diferentes estágios e formas maduras.",
      summary:"Série granulocítica presente sem predomínio desproporcional.",
      expansionContext:{
        relativeMyeloidPredominance:false,
        broadMaturationSpectrum:true,
        numerousGranulocyticPrecursors:false,
        matureNeutrophilicFormsPresent:true,
        leftShiftedMaturationSpectrum:false,
        erythroidRelativeReduction:false,
        disproportionateMyeloidRepresentation:false,
        denseMyeloidField:false
      }
    },
    erythroidSeries:{status:"present",maturation:"Diversidade eritroide preservada."},
    blastAssessment:{
      evidenceState:"NOT_OBSERVED_IN_EVALUABLE_FIELD",
      approximateImmatureCellCount:4,
      immatureCellBurden:"few",
      populationPattern:"heterogeneous",
      precursorContext:{
        maturationHeterogeneity:true,
        maturationContinuum:true,
        matureFormsPresent:true,
        lineageDiversity:true,
        orderlyGranulocyticMaturation:true,
        nonMonomorphicBackground:true
      },
      morphologySupport:{
        highNCRatio:false,
        openFineChromatin:true,
        nucleoli:false,
        scantBasophilicCytoplasm:false,
        monomorphism:false,
        repeatedAcrossField:false
      },
      blastoidSubpopulationContext:{
        distinctFromMaturationContinuum:false,
        morphologicallyCoherent:false,
        repeatedSubsetAcrossField:false
      }
    }
  };
}

function myeloidExpansion() {
  const x = normalMarrow();
  x.myeloidSeries = {
    status:"present",
    maturation:"Amplo espectro maturativo granulocítico, com precursores, formas intermediárias e neutrófilos maduros.",
    summary:"Predomínio mieloide/granulocítico com expansão relativa e numerosos precursores, mantendo maturação.",
    expansionContext:{
      relativeMyeloidPredominance:true,
      broadMaturationSpectrum:true,
      numerousGranulocyticPrecursors:true,
      matureNeutrophilicFormsPresent:true,
      leftShiftedMaturationSpectrum:true,
      basophilEosinophilEnrichment:false,
      erythroidRelativeReduction:true,
      disproportionateMyeloidRepresentation:true,
      denseMyeloidField:true
    }
  };
  x.erythroidSeries = {
    status:"present",
    maturation:"Série eritroide presente, relativamente menos representada neste campo."
  };
  x.blastAssessment = {
    ...x.blastAssessment,
    approximateImmatureCellCount:25,
    immatureCellBurden:"numerous",
    spatialDistribution:"diffuse",
    populationPattern:"heterogeneous",
    morphologySupport:{
      highNCRatio:false,
      openFineChromatin:false,
      nucleoli:false,
      scantBasophilicCytoplasm:false,
      monomorphism:false,
      repeatedAcrossField:false
    },
    blastoidSubpopulationContext:{
      distinctFromMaturationContinuum:false,
      morphologicallyCoherent:false,
      repeatedSubsetAcrossField:false,
      disproportionateImmatureSubset:false,
      matureFormsCoexist:true
    }
  };
  return x;
}

function amlLikeBlastoid() {
  const x = myeloidExpansion();
  x.blastAssessment = {
    ...x.blastAssessment,
    evidenceState:"SUSPICIOUS_POPULATION",
    observed:false,
    approximateBlastLikeCells:10,
    morphologySupport:{
      highNCRatio:true,
      openFineChromatin:true,
      nucleoli:true,
      scantBasophilicCytoplasm:true,
      monomorphism:true,
      repeatedAcrossField:true
    },
    blastoidSubpopulationContext:{
      distinctFromMaturationContinuum:true,
      morphologicallyCoherent:true,
      repeatedSubsetAcrossField:true,
      repeatedCellsWithSimilarFeatures:true,
      disproportionateImmatureSubset:true,
      matureFormsCoexist:true
    }
  };
  return x;
}

test("PASS 0 — 005.38 identities are registered",()=>{
  assert.equal(MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,"BE-FIX-005.38");
  assert.equal(MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION,"BE-FIX-005.38");
});

test("PASS 1 — normal marrow remains eligible for physiologic continuum",()=>{
  const e=evaluateMarrowMyeloidExpansion(normalMarrow());
  assert.equal(e.pathologicMyeloidExpansionSupported,false);
  assert.equal(e.physiologicContinuumEligible,true);
});

test("PASS 2 — disproportionate myeloid expansion with maturation is recognized",()=>{
  const e=evaluateMarrowMyeloidExpansion(myeloidExpansion());
  assert.equal(e.maturationAxis,true);
  assert.equal(e.disproportionateAxis,true);
  assert.equal(e.expansionBurdenAxis,true);
  assert.equal(e.pathologicMyeloidExpansionSupported,true);
  assert.equal(e.classification,"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");
});

test("PASS 3 — 005.38 does not diagnose CML or BCR::ABL1",()=>{
  const o=applyMarrowMyeloidExpansionDiscrimination(myeloidExpansion());
  const serialized=JSON.stringify(o);
  assert.equal(o.marrowPathologicMaturationContinuumLock.active,true);
  assert.doesNotMatch(o.mainFinding,/CML|LMC|BCR::ABL1|leucemia mieloide cr[oô]nica/i);
  assert.match(o.clinicalMeaning,/não estabelece diagnóstico/i);
});

test("PASS 4 — 005.37 cannot relabel pathologic myeloid expansion as physiologic",()=>{
  const o=applyMarrowMyeloidExpansionDiscrimination(myeloidExpansion());
  const e=evaluateMarrowMaturationContinuum(o);
  assert.equal(e.pathologicMaturationContinuumLock,true);
  assert.equal(e.strongPhysiologicContinuum,false);
  const after=applyMarrowMaturationContinuumDiscrimination(o);
  assert.notEqual(after.marrowPhysiologicMaturationContinuumLock?.active,true);
});

test("PASS 5 — 005.27 preserves the third marrow continuum state",()=>{
  const o=applyMarrowMyeloidExpansionDiscrimination(myeloidExpansion());
  const d=evaluateMarrowPrecursorDiscrimination(o);
  assert.equal(d.pathologicMyeloidExpansionProtected,true);
  assert.equal(d.classification,"PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION");
  assert.equal(d.strongPhysiologicPattern,false);
});

test("PASS 6 — 005.30 physiologic coherence cannot overwrite 005.38",()=>{
  const o=applyMarrowMyeloidExpansionDiscrimination(myeloidExpansion());
  const p=applyMarrowPhysiologicPrecursorCoherence(o);
  assert.equal(p.marrowPhysiologicPrecursorCoherence.active,false);
  assert.equal(p.marrowPhysiologicPrecursorCoherence.pathologicMyeloidExpansion,true);
});

test("PASS 7 — true structured blastoid population outranks myeloid expansion",()=>{
  const e=evaluateMarrowMyeloidExpansion(amlLikeBlastoid());
  assert.equal(e.structuredPathologicSubset,true);
  assert.equal(e.pathologicMyeloidExpansionSupported,false);
  assert.equal(e.classification,"PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED");
});

test("PASS 8 — applying 005.38 never suppresses a structured blastoid true positive",()=>{
  const x=amlLikeBlastoid();
  const o=applyMarrowMyeloidExpansionDiscrimination(x);
  assert.equal(o.marrowPathologicMaturationContinuumLock,undefined);
  assert.equal(o.blastAssessment.evidenceState,"SUSPICIOUS_POPULATION");
});

test("PASS 9 — server prompt/runtime/order expose 005.38 and final lock",()=>{
  const s=fs.readFileSync(new URL("../server.js",import.meta.url),"utf8");
  assert.match(s,/marrowMyeloidExpansionDiscriminationVersion/);
  assert.match(s,/marrowPathologicMaturationContinuumVersion/);
  assert.match(s,/BE-FIX-005\.38 — EXPANSÃO MIELOIDE COM MATURAÇÃO/);
  const p38=s.indexOf("applyMarrowMyeloidExpansionDiscrimination(parsed)");
  const p37=s.indexOf("applyMarrowMaturationContinuumDiscrimination(parsed)");
  assert.ok(p38>0 && p38<p37);
  const last38=s.lastIndexOf("applyMarrowMyeloidExpansionDiscrimination(finalResult)");
  const cra=s.indexOf("attachClinicalResultV2(", last38);
  assert.ok(last38>0 && cra>last38);
});
