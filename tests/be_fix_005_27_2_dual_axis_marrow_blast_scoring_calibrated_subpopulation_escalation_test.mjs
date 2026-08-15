import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_DUAL_AXIS_BLAST_SCORING_VERSION,
  scoreMarrowBlastAxes,
} from '../ai/boneMarrow/marrowBlastScoringEngine.js';
import {
  MARROW_DUAL_AXIS_SCORING_VERSION,
  evaluateMarrowPrecursorDiscrimination,
  applyMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';
import {
  evaluateMarrowBlastPopulationEvidence,
  applyMarrowBlastPopulationGovernance,
} from '../ai/boneMarrow/marrowBlastPopulationSentinel.js';
import { enforceBoneMarrowOutputContract } from '../ai/boneMarrow/boneMarrowOutputContract.js';

const marrow = (blastAssessment = {}, extra = {}) => ({
  specimenType: 'BONE_MARROW_ASPIRATE',
  blastAssessment,
  findings: {},
  overallAssessment: {},
  structuredReport: {},
  morphologyAnalysis: {},
  hematologicReasoning: {},
  whatAISees: {},
  ...extra,
});

test('PASS 0 — 005.27.2 dual-axis identity is registered', () => {
  assert.equal(MARROW_DUAL_AXIS_BLAST_SCORING_VERSION, 'BE-FIX-005.27.2');
  assert.equal(MARROW_DUAL_AXIS_SCORING_VERSION, 'BE-FIX-005.27.2');
});

test('PASS 1 — physiologic marrow scores high on maturation and low on blastoid axis', () => {
  const score = scoreMarrowBlastAxes({
    physiologicSignals: {
      maturationHeterogeneity: true,
      maturationContinuum: true,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: true,
      nonMonomorphicBackground: true,
    },
    blastSpecificSignals: { monomorphism: false },
    blastoidSubpopulationSignals: {},
    evidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
    populationPattern: 'heterogeneous',
  });
  assert.ok(score.physiologicScore >= 0.9);
  assert.ok(score.blastoidScore < 0.2);
  assert.equal(score.physiologicDominance, true);
  assert.equal(score.suspiciousEscalation, false);
});

test('PASS 2 — global heterogeneity cannot erase a strong repeated blastoid subset', () => {
  const result = marrow({
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 12,
    populationPattern: 'repeated',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      monomorphism: false,
      repeatedAcrossField: true,
    },
    precursorContext: {
      maturationHeterogeneity: true,
      maturationContinuum: true,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: true,
      nonMonomorphicBackground: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
  });
  const d = evaluateMarrowPrecursorDiscrimination(result);
  assert.ok(d.dualAxis.blastoidScore >= 0.53);
  assert.equal(d.strongBlastoidPattern, true);
  assert.equal(d.strongPhysiologicPattern, false);
  assert.equal(d.suppressBlastPromotion, false);
});

test('PASS 3 — calibrated subpopulation escalates to suspicious despite mature-cell coexistence', () => {
  const result = marrow({
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 10,
    populationPattern: 'repeated',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      monomorphism: false,
      repeatedAcrossField: true,
    },
    precursorContext: {
      maturationHeterogeneity: true,
      maturationContinuum: true,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: true,
      nonMonomorphicBackground: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
  });
  const e = evaluateMarrowBlastPopulationEvidence(result);
  assert.equal(e.suspiciousPopulation, true);
  const out = applyMarrowBlastPopulationGovernance(result);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
});

test('PASS 4 — isolated N:C/chromatin traits cannot promote physiologic precursors', () => {
  const result = marrow({
    evidenceState: 'FOCAL_SUSPICION',
    approximateBlastLikeCells: 2,
    populationPattern: 'heterogeneous',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: false,
      scantBasophilicCytoplasm: false,
      monomorphism: false,
      repeatedAcrossField: false,
    },
    precursorContext: {
      maturationHeterogeneity: true,
      maturationContinuum: true,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: true,
      nonMonomorphicBackground: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: false,
      morphologicallyCoherent: false,
      repeatedSubsetAcrossField: false,
      disproportionateImmatureSubset: false,
      matureFormsCoexist: true,
    },
  });
  const d = evaluateMarrowPrecursorDiscrimination(result);
  assert.equal(d.strongBlastoidPattern, false);
  assert.equal(d.strongPhysiologicPattern, true);
});

test('PASS 5 — intermediate morphology remains indeterminate instead of false high-risk', () => {
  const result = marrow({
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 4,
    populationPattern: 'heterogeneous',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: false,
      scantBasophilicCytoplasm: false,
      monomorphism: false,
      repeatedAcrossField: false,
    },
    precursorContext: {
      maturationHeterogeneity: true,
      maturationContinuum: false,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: false,
      nonMonomorphicBackground: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: false,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: false,
      disproportionateImmatureSubset: false,
      matureFormsCoexist: true,
    },
  });
  const d = evaluateMarrowPrecursorDiscrimination(result);
  assert.equal(d.ambiguousPrecursorVsBlast, true);
  const out = applyMarrowPrecursorDiscrimination(result);
  assert.equal(out.finalClassification, 'MARROW_IMMATURE_POPULATION_INDETERMINATE');
});

test('PASS 6 — observed structured blastoid population remains protected', () => {
  const result = marrow({
    observed: true,
    evidenceState: 'OBSERVED_POPULATION',
    approximateBlastLikeCells: 15,
    populationPattern: 'dominant',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      monomorphism: true,
      repeatedAcrossField: true,
    },
    precursorContext: {
      maturationHeterogeneity: true,
      maturationContinuum: true,
      matureFormsPresent: true,
      lineageDiversity: true,
      orderlyGranulocyticMaturation: true,
      nonMonomorphicBackground: false,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
  });
  const out = applyMarrowBlastPopulationGovernance(result);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_OBSERVED');
  assert.equal(out.findings.blastSuspicion, true);
});

test('PASS 7 — bone marrow contract carries 005.27.2 scoring metadata', () => {
  const result = marrow({
    evidenceState: 'NOT_ASSESSABLE',
    dualAxisBlastScoring: { blastoidScore: 0.2, physiologicScore: 0.8 },
  });
  const out = enforceBoneMarrowOutputContract(result, { rawResult: result, specimenGate: { specimenType: 'BONE_MARROW_ASPIRATE' } });
  assert.equal(out.blastAssessment.dualAxisBlastScoringVersion, 'BE-FIX-005.27.2');
  assert.equal(out.blastAssessment.dualAxisBlastScoring.blastoidScore, 0.2);
});

test('PASS 8 — server prompt requires dual-axis reasoning and deterministic backend scoring', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /BE-FIX-005\.27\.2 — DUAL-AXIS MARROW BLAST SCORING/);
  assert.match(source, /backend calcula os dois eixos de forma determinística/i);
});

test('PASS 9 — runtime exposes 005.27.2 without removing 005.27.1', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /marrowPrecursorRebalancingVersion/);
  assert.match(source, /marrowDualAxisBlastScoringVersion/);
  assert.match(source, /MARROW_DUAL_AXIS_SCORING_VERSION/);
});
