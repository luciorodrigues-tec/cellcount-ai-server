import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION,
  MARROW_GLOBAL_PATTERN_COHERENCE_VERSION,
  applyMarrowPhysiologicPrecursorCoherence,
} from '../ai/boneMarrow/marrowPhysiologicPrecursorCoherenceEngine.js';
import {
  applyMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';
import {
  applyMarrowPositiveBlastEvidencePreservation,
} from '../ai/boneMarrow/marrowPositiveBlastEvidencePreservationEngine.js';
import {
  applyMarrowBlastPopulationGovernance,
} from '../ai/boneMarrow/marrowBlastPopulationSentinel.js';
import {
  createLocalMorphologyEvidence,
} from '../ai/localMorphologyEvidenceContract.js';
import analyzeGlobalPattern from '../ai/globalPatternEngine.js';

function physiologicRaw() {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    specimenAssessment: { status: 'present', specimenType: 'BONE_MARROW_ASPIRATE' },
    marrowAdequacy: { status: 'indeterminate', summary: 'Campo focal de representatividade limitada.' },
    myeloidSeries: { status: 'present', maturation: 'continuidade maturativa', summary: 'Formas precursoras e maduras coexistentes.' },
    erythroidSeries: { status: 'present', summary: 'Série eritroide presente.' },
    megakaryocyticSeries: { status: 'notObserved', summary: 'Não observada no campo.' },
    blastAssessment: {
      status: 'indeterminate',
      observed: null,
      evidenceState: 'NOT_ASSESSABLE',
      approximateBlastLikeCells: null,
      approximateImmatureCellCount: 6,
      immatureCellBurden: 'multiple',
      spatialDistribution: 'repeated_across_field',
      populationPattern: 'heterogeneous',
      morphologySupport: {
        highNCRatio: false,
        openFineChromatin: true,
        nucleoli: false,
        scantBasophilicCytoplasm: false,
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
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: false,
        disproportionateImmatureSubset: false,
        matureFormsCoexist: true,
      },
      summary: 'Múltiplos precursores em padrão heterogêneo com continuidade maturativa; sem subpopulação blastoide distinta.',
    },
    morphologyAnalysis: {
      overview: 'Campo medular heterogêneo e limitado.',
      leukocyteReview: 'Precursores e formas maduras coexistentes.',
      summary: 'Maturação medular heterogênea.',
      absentFindings: 'A não visualização não permite exclusão global.',
    },
    fieldAdequacy: {
      visibleLeukocytes: 5,
      limitedField: true,
      adequateForPopulationAssessment: false,
      adequateForBlastScreening: false,
      blastAssessability: {
        state: 'NOT_ASSESSABLE',
        adequateForBlastScreening: false,
        negativeBlastConclusionAllowed: false,
      },
    },
  };
}

function physiologicResult() {
  const raw = physiologicRaw();
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  let out = {
    ...raw,
    rawResponse: structuredClone(raw),
    localMorphologyEvidence: lme,
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      monomorphicPopulation: false,
      blastEvidenceState: 'NOT_ASSESSABLE',
    },
    overallAssessment: {},
    structuredReport: {},
    whatAISees: {},
    patternRecognition: {},
    positiveFindings: [],
    blockNormalReason: ['Campo microscópico limitado'],
    normalityBlocked: true,
    morphologicRiskClass: 'CLASS_1_LIMITED_FIELD',
    finalClassification: 'CLASS_1_LIMITED_FIELD',
  };
  out = applyMarrowPrecursorDiscrimination(out);
  return out;
}

function truePositiveResult() {
  const raw = physiologicRaw();
  raw.blastAssessment = {
    ...raw.blastAssessment,
    status: 'present',
    observed: true,
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 14,
    populationPattern: 'repeated',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      monomorphism: true,
      repeatedAcrossField: true,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
  };
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  return applyMarrowPrecursorDiscrimination({
    ...raw,
    rawResponse: structuredClone(raw),
    localMorphologyEvidence: lme,
    findings: { blastSuspicion: true, immatureCells: true, blastEvidenceState: 'SUSPICIOUS_INDETERMINATE' },
    overallAssessment: {}, structuredReport: {}, whatAISees: {}, patternRecognition: {},
    fieldAdequacy: raw.fieldAdequacy,
    blockNormalReason: [],
  });
}

test('PASS 0 — 005.30 identities are registered', () => {
  assert.equal(MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION, 'BE-FIX-005.30');
  assert.equal(MARROW_GLOBAL_PATTERN_COHERENCE_VERSION, 'BE-FIX-005.30');
});

test('PASS 1 — physiologic precursor dominance activates anti-escalation', () => {
  const input = physiologicResult();
  const out = applyMarrowPhysiologicPrecursorCoherence(input);
  assert.equal(out.marrowPhysiologicPrecursorCoherence.active, true);
  assert.equal(out.marrowPhysiologicPrecursorCoherence.physiologicDominance, true);
  assert.equal(out.findings.blastSuspicion, false);
  assert.equal(out.findings.immatureCells, false);
});

test('PASS 2 — downstream stale/legacy positive blast promotion is removed when 005.27.2 says physiologic dominance', () => {
  const input = physiologicResult();
  input.findings = { ...input.findings, blastSuspicion: true, immatureCells: true, blastEvidenceState: 'SUSPICIOUS_INDETERMINATE' };
  input.marrowBlastPopulationEvidence = {
    evidenceState: 'SUSPICIOUS_POPULATION',
    suspiciousPopulation: true,
    positivePopulationFinding: true,
    precursorDiscrimination: input.marrowPrecursorDiscrimination,
  };
  input.marrowPositiveBlastEvidencePreservation = { version: 'BE-FIX-005.29', active: true, positiveEvidencePresent: true };
  input.mainFinding = 'SUSPEITA DE POPULAÇÃO BLASTOIDE/IMATURA: evidência positiva preservada.';
  input.blockNormalReason.push('Evidência medular positiva de população blastoide/imatura');

  const out = applyMarrowPhysiologicPrecursorCoherence(input);
  assert.equal(out.findings.blastSuspicion, false);
  assert.equal(out.marrowBlastPopulationEvidence.positivePopulationFinding, false);
  assert.equal(out.marrowPositiveBlastEvidencePreservation.active, false);
  assert.doesNotMatch(out.riskLevel, /alta prioridade|crítico|suspeita de população blastoide/i);
  assert.match(out.mainFinding, /maturação medular heterogênea/i);
});

test('PASS 3 — NOT_ASSESSABLE remains NOT_ASSESSABLE instead of becoming a false negative or false positive', () => {
  const out = applyMarrowPhysiologicPrecursorCoherence(physiologicResult());
  assert.equal(out.findings.blastEvidenceState, 'NOT_ASSESSABLE');
  assert.equal(out.fieldAdequacy.blastAssessability.state, 'NOT_ASSESSABLE');
  assert.equal(out.fieldAdequacy.blastAssessability.positiveEvidencePresent, false);
});

test('PASS 4 — limited physiologic marrow receives a coherent marrow maturation global pattern, never GLOBAL_UNREMARKABLE_PATTERN', () => {
  let input = physiologicResult();
  input.globalPattern = analyzeGlobalPattern(input);
  input = applyMarrowPhysiologicPrecursorCoherence(input);
  assert.equal(input.globalPattern.dominantPattern, 'MARROW_PHYSIOLOGIC_MATURATION_LIMITED_PATTERN');
  assert.notEqual(input.globalPattern.dominantPattern, 'GLOBAL_UNREMARKABLE_PATTERN');
  assert.equal(input.globalPattern.normalityBlocked, true);
});

test('PASS 5 — globalPatternEngine natively recognizes physiologic precursor pattern before any 005.30 post-governor lock', () => {
  const input = physiologicResult();
  const global = analyzeGlobalPattern(input);
  assert.equal(global.physiologicPrecursorPattern, true);
  assert.equal(global.dominantPattern, 'MARROW_PHYSIOLOGIC_MATURATION_LIMITED_PATTERN');
  assert.notEqual(global.dominantPattern, 'GLOBAL_UNREMARKABLE_PATTERN');
});

test('PASS 6 — true structured blastoid subpopulation remains protected by 005.29/005.24 and is not suppressed by 005.30', () => {
  let input = truePositiveResult();
  input = applyMarrowBlastPopulationGovernance(input);
  input = applyMarrowPositiveBlastEvidencePreservation(input);
  const before = input.morphologicRiskClass;
  const out = applyMarrowPhysiologicPrecursorCoherence(input);
  assert.equal(out.marrowPhysiologicPrecursorCoherence.active, false);
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(out.morphologicRiskClass, before);
  assert.match(out.morphologicRiskClass, /MARROW_BLASTOID_POPULATION/);
});

test('PASS 7 — 005.30 strips only false blast-positive reasons while preserving adequacy limitations', () => {
  const input = physiologicResult();
  input.blockNormalReason = [
    'Campo microscópico limitado',
    'Evidência medular positiva de população blastoide/imatura',
    'Suspeita de células imaturas/blásticas',
  ];
  const out = applyMarrowPhysiologicPrecursorCoherence(input);
  assert.ok(out.blockNormalReason.some((x) => /campo microscópico limitado/i.test(x)));
  assert.equal(out.blockNormalReason.some((x) => /evidência medular positiva de população blastoide/i.test(x)), false);
  assert.equal(out.blockNormalReason.some((x) => /suspeita de células imaturas\/blásticas/i.test(x)), false);
});

test('PASS 8 — server exposes 005.30 runtime fingerprint and applies anti-escalation before and after late blast governance', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /MARROW_PHYSIOLOGIC_PRECURSOR_COHERENCE_VERSION/);
  assert.match(source, /marrowPhysiologicPrecursorCoherenceVersion/);
  assert.match(source, /marrowGlobalPatternCoherenceVersion/);
  const calls = source.match(/applyMarrowPhysiologicPrecursorCoherence\(/g) || [];
  assert.ok(calls.length >= 8, `expected >=8 coherence calls, got ${calls.length}`);
  assert.match(source, /applyMarrowPrecursorDiscrimination\(finalResult\);\s*finalResult = applyMarrowPhysiologicPrecursorCoherence\(finalResult\);[\s\S]*applySingleBlastSentinel/);
  assert.match(source, /applyMarrowBlastPopulationGovernance\(finalResult\);\s*finalResult = applyMarrowPhysiologicPrecursorCoherence\(finalResult\);/);
});

test('PASS 9 — 005.29 identity remains intact while 005.30 is additive', () => {
  const preservation = fs.readFileSync(new URL('../ai/boneMarrow/marrowPositiveBlastEvidencePreservationEngine.js', import.meta.url), 'utf8');
  assert.match(preservation, /BE-FIX-005\.29/);
  const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(server, /marrowPositiveBlastE2EPreservationVersion/);
  assert.match(server, /marrowPhysiologicPrecursorCoherenceVersion/);
});
