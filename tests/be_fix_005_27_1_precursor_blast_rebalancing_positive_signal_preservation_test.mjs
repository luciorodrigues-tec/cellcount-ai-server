import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_PRECURSOR_DISCRIMINATION_VERSION,
  MARROW_PRECURSOR_REBALANCING_VERSION,
  evaluateMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';

import {
  applyMarrowBlastPopulationGovernance,
  evaluateMarrowBlastPopulationEvidence,
  MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
  MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
} from '../ai/boneMarrow/marrowBlastPopulationSentinel.js';

import { enforceBoneMarrowOutputContract } from '../ai/boneMarrow/boneMarrowOutputContract.js';

const normalMarrow = {
  specimenType: 'BONE_MARROW_ASPIRATE',
  specimenAssessment: { status: 'present', specimenType: 'BONE_MARROW_ASPIRATE', summary: 'Aspirado medular.' },
  marrowAdequacy: { status: 'present', representativity: 'avaliável no campo', summary: 'Material medular avaliável.' },
  myeloidSeries: { status: 'present', maturation: 'maturação progressiva com diferentes estágios granulocíticos', summary: 'Série mieloide heterogênea com precursores e formas maduras.' },
  erythroidSeries: { status: 'present', maturation: 'diversidade maturativa', summary: 'Série eritroide com diferentes estágios.' },
  megakaryocyticSeries: { status: 'present', summary: 'Elementos megacariocíticos representados.' },
  blastAssessment: {
    status: 'present', observed: null, evidenceState: 'SUSPICIOUS_POPULATION', approximateBlastLikeCells: 8,
    populationPattern: 'heterogeneous',
    morphologySupport: { highNCRatio: true, openFineChromatin: true, nucleoli: false, scantBasophilicCytoplasm: false, monomorphism: false, repeatedAcrossField: false },
    precursorContext: { maturationHeterogeneity: true, maturationContinuum: true, matureFormsPresent: true, lineageDiversity: true, orderlyGranulocyticMaturation: true, nonMonomorphicBackground: true },
    blastoidSubpopulationContext: { distinctFromMaturationContinuum: false, morphologicallyCoherent: false, repeatedSubsetAcrossField: false, disproportionateImmatureSubset: false, matureFormsCoexist: true },
    lineageAssignable: false, lineage: 'indeterminate', summary: 'Células imaturas integradas à continuidade maturativa.'
  },
  findings: { blastSuspicion: true, immatureCells: true, monomorphicPopulation: false },
  overallAssessment: {}, structuredReport: {}, morphologyAnalysis: {}, hematologicReasoning: {}, whatAISees: {},
};
normalMarrow.rawResponse = structuredClone(normalMarrow);

const heterogeneousWithBlastoidSubset = structuredClone(normalMarrow);
heterogeneousWithBlastoidSubset.blastAssessment = {
  ...heterogeneousWithBlastoidSubset.blastAssessment,
  evidenceState: 'SUSPICIOUS_POPULATION',
  approximateBlastLikeCells: 12,
  populationPattern: 'heterogeneous',
  morphologySupport: { highNCRatio: true, openFineChromatin: true, nucleoli: true, scantBasophilicCytoplasm: true, monomorphism: false, repeatedAcrossField: true },
  precursorContext: { maturationHeterogeneity: true, maturationContinuum: true, matureFormsPresent: true, lineageDiversity: true, orderlyGranulocyticMaturation: true, nonMonomorphicBackground: true },
  blastoidSubpopulationContext: { distinctFromMaturationContinuum: true, morphologicallyCoherent: true, repeatedSubsetAcrossField: true, disproportionateImmatureSubset: true, matureFormsCoexist: true },
  summary: 'Fundo medular heterogêneo contendo subpopulação distinta, repetida e citomorfologicamente coerente de elementos blastoides.'
};
heterogeneousWithBlastoidSubset.rawResponse = structuredClone(heterogeneousWithBlastoidSubset);

const ambiguousSubset = structuredClone(heterogeneousWithBlastoidSubset);
ambiguousSubset.blastAssessment.blastoidSubpopulationContext = {
  distinctFromMaturationContinuum: false,
  morphologicallyCoherent: true,
  repeatedSubsetAcrossField: true,
  disproportionateImmatureSubset: false,
  matureFormsCoexist: true,
};
ambiguousSubset.blastAssessment.morphologySupport.nucleoli = false;
ambiguousSubset.rawResponse = structuredClone(ambiguousSubset);

test('PASS 0 — 005.27 identity remains and 005.27.1 rebalancing identity is registered', () => {
  assert.equal(MARROW_PRECURSOR_DISCRIMINATION_VERSION, 'BE-FIX-005.27');
  assert.equal(MARROW_PRECURSOR_REBALANCING_VERSION, 'BE-FIX-005.27.1');
  assert.equal(MARROW_BLAST_POPULATION_GOVERNANCE_VERSION, 'BE-FIX-005.24');
  assert.equal(MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION, 'BE-FIX-005.26');
});

test('PASS 1 — normal heterogeneous marrow remains physiologic when no distinct blastoid subset exists', () => {
  const d = evaluateMarrowPrecursorDiscrimination(normalMarrow);
  assert.equal(d.strongPhysiologicPattern, true);
  assert.equal(d.protectedSuspiciousBlastoid, false);
  const out = applyMarrowBlastPopulationGovernance(normalMarrow);
  assert.equal(out.finalClassification, 'MARROW_PHYSIOLOGIC_MATURATION_PATTERN');
  assert.equal(out.findings.blastSuspicion, false);
});

test('PASS 2 — global heterogeneity cannot erase a distinct coherent repeated blastoid subpopulation', () => {
  const d = evaluateMarrowPrecursorDiscrimination(heterogeneousWithBlastoidSubset);
  assert.equal(d.coherentBlastoidSubpopulation, true);
  assert.equal(d.protectedSuspiciousBlastoid, true);
  assert.equal(d.strongPhysiologicPattern, false);
  assert.equal(d.strongBlastoidPattern, true);
});

test('PASS 3 — suspicious blastoid subset survives final marrow governance despite mature-cell coexistence', () => {
  const out = applyMarrowBlastPopulationGovernance(heterogeneousWithBlastoidSubset);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.equal(out.findings.blastSuspicion, true);
  assert.match(out.mainFinding, /SUSPEITA DE POPULAÇÃO BLASTOIDE\/IMATURA/i);
});

test('PASS 4 — mature forms may coexist with a pathologic blastoid subset', () => {
  const d = evaluateMarrowPrecursorDiscrimination(heterogeneousWithBlastoidSubset);
  assert.equal(d.physiologicSignals.matureFormsPresent, true);
  assert.equal(d.blastoidSubpopulationSignals.matureFormsCoexist, true);
  assert.equal(d.protectedSuspiciousBlastoid, true);
});

test('PASS 5 — N:C/chromatin alone do not defeat physiologic precursor containment', () => {
  const d = evaluateMarrowPrecursorDiscrimination(normalMarrow);
  assert.equal(d.blastSpecificSignals.highNCRatio, true);
  assert.equal(d.blastSpecificSignals.openFineChromatin, true);
  assert.equal(d.classification, 'PHYSIOLOGIC_PRECURSOR_PATTERN');
});

test('PASS 6 — ambiguous subset remains non-high-risk when not distinct from maturation continuum', () => {
  const d = evaluateMarrowPrecursorDiscrimination(ambiguousSubset);
  assert.equal(d.coherentBlastoidSubpopulation, false);
  assert.equal(d.protectedSuspiciousBlastoid, false);
  assert.notEqual(d.classification, 'BLASTOID_PATTERN_SUPPORTED');
});

test('PASS 7 — output contract preserves blastoidSubpopulationContext', () => {
  const out = enforceBoneMarrowOutputContract(heterogeneousWithBlastoidSubset, {
    rawResult: heterogeneousWithBlastoidSubset,
    specimenGate: { specimenType: 'BONE_MARROW_ASPIRATE', analysisType: 'bone_marrow' },
  });
  assert.equal(out.blastAssessment.blastoidSubpopulationContext.distinctFromMaturationContinuum, true);
  assert.equal(out.blastAssessment.blastoidSubpopulationContext.repeatedSubsetAcrossField, true);
});

test('PASS 8 — server prompt requires subpopulation-vs-continuum discrimination', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /BE-FIX-005\.27\.1 — REBALANCEAMENTO PRECURSOR\/BLASTO/);
  assert.match(source, /blastoidSubpopulationContext/);
  assert.match(source, /distinctFromMaturationContinuum/);
  assert.match(source, /morphologicallyCoherent/);
  assert.match(source, /repeatedSubsetAcrossField/);
});

test('PASS 9 — runtime exposes 005.27.1 without removing 005.27 or 005.26', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /marrowPrecursorDiscriminationVersion/);
  assert.match(source, /marrowPrecursorRebalancingVersion/);
  assert.match(source, /MARROW_PRECURSOR_REBALANCING_VERSION/);
  assert.match(source, /marrowPositiveEvidencePriorityLockVersion/);
});
