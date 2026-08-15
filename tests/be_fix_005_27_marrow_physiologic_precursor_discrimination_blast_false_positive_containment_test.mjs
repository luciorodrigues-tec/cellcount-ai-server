import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_PRECURSOR_DISCRIMINATION_VERSION,
  evaluateMarrowPrecursorDiscrimination,
  applyMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';

import {
  MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
  MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
  MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_VERSION,
  evaluateMarrowBlastPopulationEvidence,
  applyMarrowBlastPopulationGovernance,
} from '../ai/boneMarrow/marrowBlastPopulationSentinel.js';

import {
  enforceBoneMarrowOutputContract,
  MARROW_PRECURSOR_DISCRIMINATION_CONTRACT_VERSION,
} from '../ai/boneMarrow/boneMarrowOutputContract.js';

import {
  createLocalMorphologyEvidence,
  MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_LME_VERSION,
} from '../ai/localMorphologyEvidenceContract.js';

const normalMarrow = {
  specimenType: 'BONE_MARROW_ASPIRATE',
  specimenAssessment: {
    status: 'present',
    specimenType: 'BONE_MARROW_ASPIRATE',
    summary: 'Aspirado medular.',
  },
  marrowAdequacy: {
    status: 'present',
    representativity: 'avaliável no campo',
    summary: 'Material medular avaliável.',
  },
  myeloidSeries: {
    status: 'present',
    maturation: 'maturação progressiva com diferentes estágios granulocíticos',
    summary: 'Série mieloide heterogênea com precursores e formas maduras.',
  },
  erythroidSeries: {
    status: 'present',
    maturation: 'diversidade maturativa',
    summary: 'Série eritroide com diferentes estágios.',
  },
  megakaryocyticSeries: { status: 'present', summary: 'Elementos megacariocíticos representados.' },
  blastAssessment: {
    status: 'present',
    observed: null,
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 8,
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
    lineageAssignable: false,
    lineage: 'indeterminate',
    summary: 'Células imaturas em fundo com continuidade maturativa.',
  },
  findings: { blastSuspicion: true, immatureCells: true, monomorphicPopulation: false },
  overallAssessment: {},
  structuredReport: {},
  morphologyAnalysis: {},
  hematologicReasoning: {},
  whatAISees: {},
};
normalMarrow.rawResponse = structuredClone(normalMarrow);

const blastoidMarrow = structuredClone(normalMarrow);
blastoidMarrow.blastAssessment = {
  ...blastoidMarrow.blastAssessment,
  evidenceState: 'SUSPICIOUS_POPULATION',
  approximateBlastLikeCells: 18,
  populationPattern: 'repeated',
  morphologySupport: {
    highNCRatio: true,
    openFineChromatin: true,
    nucleoli: true,
    scantBasophilicCytoplasm: true,
    monomorphism: true,
    repeatedAcrossField: true,
  },
  precursorContext: {
    maturationHeterogeneity: false,
    maturationContinuum: false,
    matureFormsPresent: false,
    lineageDiversity: false,
    orderlyGranulocyticMaturation: false,
    nonMonomorphicBackground: false,
  },
  summary: 'População repetida relativamente monomórfica com morfologia blastoide.',
};
blastoidMarrow.findings = { blastSuspicion: true, immatureCells: true, monomorphicPopulation: true };
blastoidMarrow.rawResponse = structuredClone(blastoidMarrow);

const observedBlastoidMarrow = structuredClone(blastoidMarrow);
observedBlastoidMarrow.blastAssessment.evidenceState = 'OBSERVED_POPULATION';
observedBlastoidMarrow.blastAssessment.observed = true;
observedBlastoidMarrow.blastAssessment.populationPattern = 'dominant';
observedBlastoidMarrow.rawResponse = structuredClone(observedBlastoidMarrow);

test('PASS 0 — 005.27 identity is registered while 005.24/005.26 identities remain intact', () => {
  assert.equal(MARROW_PRECURSOR_DISCRIMINATION_VERSION, 'BE-FIX-005.27');
  assert.equal(MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_VERSION, 'BE-FIX-005.27');
  assert.equal(MARROW_PRECURSOR_DISCRIMINATION_CONTRACT_VERSION, 'BE-FIX-005.27');
  assert.equal(MARROW_PRECURSOR_FALSE_POSITIVE_CONTAINMENT_LME_VERSION, 'BE-FIX-005.27');
  assert.equal(MARROW_BLAST_POPULATION_GOVERNANCE_VERSION, 'BE-FIX-005.24');
  assert.equal(MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION, 'BE-FIX-005.26');
});

test('PASS 1 — heterogeneous orderly maturation is recognized as physiologic precursor pattern', () => {
  const d = evaluateMarrowPrecursorDiscrimination(normalMarrow);
  assert.equal(d.strongPhysiologicPattern, true);
  assert.equal(d.suppressBlastPromotion, true);
  assert.equal(d.classification, 'PHYSIOLOGIC_PRECURSOR_PATTERN');
});

test('PASS 2 — physiologic precursors are not promoted to suspicious blast population', () => {
  const evidence = evaluateMarrowBlastPopulationEvidence(normalMarrow);
  assert.equal(evidence.suspiciousPopulation, false);
  assert.equal(evidence.observedPopulation, false);
  assert.equal(evidence.positivePopulationFinding, false);
  assert.equal(evidence.physiologicPrecursorPattern, true);
});

test('PASS 3 — final marrow governance returns maturation pattern instead of high-risk blast alert for normal-like marrow', () => {
  const out = applyMarrowBlastPopulationGovernance(normalMarrow);
  assert.equal(out.finalClassification, 'MARROW_PHYSIOLOGIC_MATURATION_PATTERN');
  assert.equal(out.findings.blastSuspicion, false);
  assert.doesNotMatch(out.riskLevel, /alto risco|crítico|blast.*suspeit/i);
  assert.match(out.mainFinding, /maturação medular heterogênea/i);
});

test('PASS 4 — LME does not expose physiologic marrow precursors as critical blast morphology', () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: normalMarrow });
  assert.equal(lme.marrow.precursorDiscrimination.strongPhysiologicPattern, true);
  assert.equal(lme.marrow.blastPopulationEvidence.positive, false);
  assert.notEqual(lme.criticalMorphology.blastLikeMorphology, 'SUSPICIOUS_INDETERMINATE');
  assert.notEqual(lme.criticalMorphology.blastLikeMorphology, 'OBSERVED');
});

test('PASS 5 — true structured suspicious blastoid population remains suspicious after 005.27', () => {
  const d = evaluateMarrowPrecursorDiscrimination(blastoidMarrow);
  assert.equal(d.strongBlastoidPattern, true);
  assert.equal(d.suppressBlastPromotion, false);
  const out = applyMarrowBlastPopulationGovernance(blastoidMarrow);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.equal(out.findings.blastSuspicion, true);
});

test('PASS 6 — observed blastoid population remains protected and is never erased by precursor discrimination', () => {
  const d = evaluateMarrowPrecursorDiscrimination(observedBlastoidMarrow);
  assert.equal(d.protectedObservedBlastoid, true);
  const out = applyMarrowBlastPopulationGovernance(observedBlastoidMarrow);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_OBSERVED');
  assert.equal(out.findings.blastSuspicion, true);
});

test('PASS 7 — ambiguous immature cells are capped at indeterminate rather than high-risk blast promotion', () => {
  const ambiguous = structuredClone(normalMarrow);
  ambiguous.blastAssessment.populationPattern = 'indeterminate';
  ambiguous.blastAssessment.precursorContext = {
    maturationHeterogeneity: true,
    maturationContinuum: false,
    matureFormsPresent: false,
    lineageDiversity: false,
    orderlyGranulocyticMaturation: false,
    nonMonomorphicBackground: true,
  };
  ambiguous.rawResponse = structuredClone(ambiguous);
  const d = evaluateMarrowPrecursorDiscrimination(ambiguous);
  assert.equal(d.ambiguousPrecursorVsBlast, true);
  const out = applyMarrowBlastPopulationGovernance(ambiguous);
  assert.equal(out.finalClassification, 'MARROW_IMMATURE_POPULATION_INDETERMINATE');
  assert.equal(out.findings.blastSuspicion, false);
});

test('PASS 8 — bone marrow output contract preserves precursorContext for downstream governance', () => {
  const out = enforceBoneMarrowOutputContract(normalMarrow, {
    rawResult: normalMarrow,
    specimenGate: { specimenType: 'BONE_MARROW_ASPIRATE', analysisType: 'bone_marrow' },
  });
  assert.equal(out.blastAssessment.precursorContext.maturationHeterogeneity, true);
  assert.equal(out.blastAssessment.precursorContext.maturationContinuum, true);
  assert.equal(out.blastAssessment.precursorDiscriminationVersion, 'BE-FIX-005.27');
});

test('PASS 9 — server prompt/runtime and final sentinel ordering register 005.27 without removing 005.25/005.26', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /BE-FIX-005\.27 — DISCRIMINAÇÃO OBRIGATÓRIA DE PRECURSORES FISIOLÓGICOS/);
  assert.match(source, /marrowPrecursorDiscriminationVersion/);
  assert.match(source, /MARROW_PRECURSOR_DISCRIMINATION_VERSION/);
  assert.match(source, /OPENAI_VISION_REASONING_EFFORT \|\| "none"/);
  assert.match(source, /marrowPositiveEvidencePriorityLockVersion/);
  const synthesis = source.lastIndexOf('applyEvidenceConsistentFinalMorphologySynthesis');
  const precursor = source.indexOf('applyMarrowPrecursorDiscrimination(finalResult)', synthesis);
  const singleBlast = source.indexOf('applySingleBlastSentinel', synthesis);
  assert.ok(synthesis >= 0 && precursor > synthesis && singleBlast > precursor);
});
