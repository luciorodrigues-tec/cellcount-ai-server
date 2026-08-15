import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION,
  applyMarrowPositiveBlastEvidencePreservation,
} from '../ai/boneMarrow/marrowPositiveBlastEvidencePreservationEngine.js';
import { applyFieldAdequacyRules } from '../ai/fieldAdequacyEngine.js';
import { createLocalMorphologyEvidence } from '../ai/localMorphologyEvidenceContract.js';
import analyzeGlobalPattern from '../ai/globalPatternEngine.js';

function positiveRaw() {
  return {
    specimenAssessment: {
      status: 'present',
      specimenType: 'BONE_MARROW_ASPIRATE',
    },
    marrowAdequacy: {
      status: 'present',
      summary: 'Campo medular avaliável, porém de representatividade populacional limitada.',
    },
    myeloidSeries: {
      status: 'present',
      summary: 'Série mieloide com formas maduras coexistentes.',
    },
    erythroidSeries: { status: 'present', summary: 'Série eritroide presente.' },
    megakaryocyticSeries: { status: 'notAssessable', summary: '' },
    fieldAdequacy: {
      visibleLeukocytes: 6,
      adequateForBlastScreening: false,
      adequateForPopulationAssessment: false,
      limitedField: true,
      limitationReason: 'Campo limitado para exclusão global de blastos.',
    },
    blastAssessment: {
      status: 'present',
      observed: true,
      evidenceState: 'SUSPICIOUS_POPULATION',
      approximateBlastLikeCells: 15,
      approximateImmatureCellCount: 30,
      immatureCellBurden: 'numerous',
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
      lineageAssignable: false,
      lineage: 'indeterminate',
      summary: 'Múltiplas células imaturas/blastoides repetidas com N:C elevada, cromatina fina, nucléolos e citoplasma basofílico.',
    },
    morphologyAnalysis: {
      leukocyteReview: 'Múltiplas células imaturas/blastoides repetidas no campo.',
      absentFindings: 'Blastos inequívocos não identificados. Células imaturas críticas não identificadas. Bastonetes de Auer não identificados.',
    },
    whatAISees: {
      leukocytes: 'Múltiplas células imaturas/blastoides.',
      negativeFindings: 'Blastos não identificados no campo.',
    },
    negativeFindingsStructured: [
      'Blastos inequívocos não identificados no campo.',
      'Bastonetes de Auer não identificados no campo.',
    ],
  };
}

function normalizedFromRaw(raw = positiveRaw()) {
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  return {
    rawResponse: raw,
    localMorphologyEvidence: lme,
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      blastEvidenceState: 'NOT_ASSESSABLE',
    },
    fieldAdequacy: { ...raw.fieldAdequacy },
    morphologyAnalysis: { ...raw.morphologyAnalysis },
    whatAISees: { ...raw.whatAISees },
    negativeFindingsStructured: [...raw.negativeFindingsStructured],
    positiveFindings: [],
    overallAssessment: {},
    structuredReport: {},
    patternRecognition: {},
    normalityBlocked: true,
    morphologicRiskClass: 'CLASS_1_LIMITED_FIELD',
    finalClassification: 'CLASS_1_LIMITED_FIELD',
  };
}

test('PASS 0 — 005.29 identity is registered', () => {
  assert.equal(MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION, 'BE-FIX-005.29');
});

test('PASS 1 — LME preserves structured suspicious marrow population even when negative blast screening is not assessable', () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: positiveRaw(), analysisSource: 'ai_visual' });
  assert.equal(lme.marrow.blastPopulationEvidence.positive, true);
  assert.equal(lme.criticalMorphology.blastLikeMorphology, 'SUSPICIOUS_INDETERMINATE');
});

test('PASS 2 — field adequacy becomes a negative-only blast assessability gate', () => {
  const result = applyFieldAdequacyRules(normalizedFromRaw());
  assert.equal(result.fieldAdequacy.blastAssessability.state, 'NOT_ASSESSABLE');
  assert.equal(result.fieldAdequacy.blastAssessability.assessabilityScope, 'NEGATIVE_EXCLUSION_ONLY');
  assert.equal(result.fieldAdequacy.blastAssessability.positiveEvidencePresent, true);
  assert.equal(result.fieldAdequacy.positiveBlastEvidenceOverride.active, true);
});

test('PASS 3 — 005.29 restores generic positive blast findings after legacy normalization erased them', () => {
  const out = applyMarrowPositiveBlastEvidencePreservation(normalizedFromRaw());
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(out.findings.immatureCells, true);
  assert.equal(out.findings.blastEvidenceState, 'SUSPICIOUS_INDETERMINATE');
});

test('PASS 4 — positive marrow population outranks CLASS_1_LIMITED_FIELD without making the negative screen evaluable', () => {
  const out = applyMarrowPositiveBlastEvidencePreservation(normalizedFromRaw());
  assert.equal(out.morphologicRiskClass, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.equal(out.fieldAdequacy.blastAssessability.negativeBlastConclusionAllowed, false);
});

test('PASS 5 — contradictory blast-negative narrative is removed while non-blast negative evidence remains', () => {
  const out = applyMarrowPositiveBlastEvidencePreservation(normalizedFromRaw());
  assert.doesNotMatch(out.morphologyAnalysis.absentFindings, /blastos inequívocos não identificados/i);
  assert.doesNotMatch(out.whatAISees.negativeFindings, /blastos não identificados/i);
  assert.equal(out.negativeFindingsStructured.some((x) => /blastos/i.test(x)), false);
  assert.match(out.morphologyAnalysis.absentFindings, /Bastonetes de Auer/i);
});

test('PASS 6 — global pattern preserves positive marrow blast evidence instead of reporting NOT_ASSESSABLE as the clinical state', () => {
  const result = applyFieldAdequacyRules(normalizedFromRaw());
  const global = analyzeGlobalPattern(result);
  assert.equal(global.marrowPositiveBlastEvidence, true);
  assert.equal(global.dominantPattern, 'MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN');
  assert.equal(global.blastAssessmentState, 'POSITIVE_EVIDENCE_PRESERVED');
});

test('PASS 7 — physiologic marrow without positive population state is not promoted by 005.29', () => {
  const raw = positiveRaw();
  raw.blastAssessment = {
    ...raw.blastAssessment,
    observed: false,
    evidenceState: 'NOT_ASSESSABLE',
    approximateBlastLikeCells: null,
    populationPattern: 'heterogeneous',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: false,
      scantBasophilicCytoplasm: false,
      monomorphism: false,
      repeatedAcrossField: false,
    },
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: false,
      morphologicallyCoherent: false,
      repeatedSubsetAcrossField: false,
      disproportionateImmatureSubset: false,
      matureFormsCoexist: true,
    },
  };
  const result = normalizedFromRaw(raw);
  const out = applyMarrowPositiveBlastEvidencePreservation(result);
  assert.equal(out.marrowPositiveBlastEvidencePreservation.active, false);
  assert.equal(out.findings.blastSuspicion, false);
});

test('PASS 8 — observed population is preserved as observed and never downgraded by limited-field assessability', () => {
  const raw = positiveRaw();
  raw.blastAssessment.evidenceState = 'OBSERVED_POPULATION';
  const out = applyMarrowPositiveBlastEvidencePreservation(normalizedFromRaw(raw));
  assert.equal(out.findings.blastEvidenceState, 'OBSERVED');
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_OBSERVED');
});

test('PASS 9 — server applies 005.29 across normalization, field adequacy, medullary governors and final delivery, and exposes runtime fingerprint', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /MARROW_POSITIVE_BLAST_E2E_PRESERVATION_VERSION/);
  assert.match(source, /marrowPositiveBlastE2EPreservationVersion/);
  const calls = source.match(/applyMarrowPositiveBlastEvidencePreservation\(/g) || [];
  assert.ok(calls.length >= 6, `expected >=6 preservation calls, got ${calls.length}`);
  assert.match(source, /applyFieldAdequacyRules[\s\S]*applyMarrowPositiveBlastEvidencePreservation/);
  assert.match(source, /applyFinalClinicalGovernor[\s\S]*applyMarrowPositiveBlastEvidencePreservation/);
});
