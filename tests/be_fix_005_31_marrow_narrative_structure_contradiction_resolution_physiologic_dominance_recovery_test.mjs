import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
  MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION,
  assessMarrowNarrativeStructureContradiction,
  resolveMarrowNarrativeStructureContradiction,
} from '../ai/boneMarrow/marrowNarrativeStructureContradictionResolutionEngine.js';

import {
  evaluateMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';

import {
  reconcileMarrowBlastEvidence,
} from '../ai/boneMarrow/marrowBlastEvidenceReconciliationEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, '..', 'server.js');

function negativeMarrowCase() {
  return {
    specimenType: 'HEMODILUTED_BONE_MARROW',
    specimenAssessment: { specimenType: 'HEMODILUTED_BONE_MARROW' },
    myeloidSeries: {
      maturation: 'Há coexistência de formas maduras e imaturas, sugerindo continuidade maturativa no campo avaliado.',
      summary: 'Série granulocítica presente e morfologicamente heterogênea, com maturação aparente.',
    },
    whatAISees: {
      summary: 'Campo medular hemodiluído com população nucleada heterogênea, formas granulocíticas maduras e imaturas, sem padrão monomórfico dominante inequívoco.',
    },
    morphologyAnalysis: {
      summary: 'O campo mostra mistura de células hematopoéticas com diferentes tamanhos e graus de maturação.',
    },
    blastAssessment: {
      status: 'indeterminate',
      observed: null,
      evidenceState: 'NOT_ASSESSABLE',
      approximateBlastLikeCells: null,
      approximateImmatureCellCount: 8,
      populationPattern: 'repeated',
      morphologySupport: {
        highNCRatio: null,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: true,
        monomorphism: true,
        repeatedAcrossField: true,
      },
      precursorContext: {
        maturationHeterogeneity: true,
        maturationContinuum: true,
        matureFormsPresent: true,
        lineageDiversity: true,
        nonMonomorphicBackground: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
        disproportionateImmatureSubset: null,
        matureFormsCoexist: true,
      },
      summary: 'Há múltiplas células imaturas/precursoras no campo, algumas com citoplasma basofílico, mas o padrão visual é heterogêneo e coexistem formas granulocíticas maduras e intermediárias, favorecendo contexto de maturação medular. Não se identifica população blastoide monomórfica, dominante e inequivocamente separada do continuum maturativo nesta imagem.',
    },
  };
}

function truePositiveCase() {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    specimenAssessment: { specimenType: 'BONE_MARROW_ASPIRATE' },
    myeloidSeries: {
      summary: 'Há formas maduras coexistentes, sem que isso neutralize a subpopulação anormal.',
    },
    blastAssessment: {
      status: 'present',
      observed: true,
      evidenceState: 'OBSERVED_POPULATION',
      approximateBlastLikeCells: 12,
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
        nonMonomorphicBackground: false,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
        disproportionateImmatureSubset: true,
        matureFormsCoexist: true,
      },
      summary: 'Observa-se subpopulação blastoide distinta e repetida, com relação N:C elevada, cromatina aberta e nucléolos evidentes. Formas maduras coexistem no campo.',
    },
  };
}

test('PASS 0 — 005.31 identities are registered', () => {
  assert.equal(MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION, 'BE-FIX-005.31');
  assert.equal(MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION, 'BE-FIX-005.31');
});

test('PASS 1 — production negative marrow contradiction is detected', () => {
  const reconciled = reconcileMarrowBlastEvidence(negativeMarrowCase());
  const assessment = assessMarrowNarrativeStructureContradiction(reconciled);
  assert.equal(assessment.explicitBlastoidArchitectureNegation, true);
  assert.equal(assessment.physiologicNarrativeDominance, true);
  assert.equal(assessment.structuredArchitectureConflict, true);
  assert.equal(assessment.suppressSuspiciousPromotion, true);
});

test('PASS 2 — false SUSPICIOUS promotion is recovered to physiologic/indeterminate acquisition state', () => {
  const reconciled = reconcileMarrowBlastEvidence(negativeMarrowCase());
  assert.equal(reconciled.blastAssessment.evidenceState, 'SUSPICIOUS_POPULATION');
  const resolved = resolveMarrowNarrativeStructureContradiction(reconciled);
  assert.equal(resolved.blastAssessment.evidenceState, 'NOT_ASSESSABLE');
  assert.equal(resolved.blastAssessment.populationPattern, 'heterogeneous');
  assert.equal(resolved.blastAssessment.physiologicDominanceRecovered, true);
});

test('PASS 3 — negated blastoid architecture is corrected without erasing precursor repetition', () => {
  const resolved = resolveMarrowNarrativeStructureContradiction(
    reconcileMarrowBlastEvidence(negativeMarrowCase()),
  );
  assert.equal(resolved.blastAssessment.morphologySupport.monomorphism, false);
  assert.equal(resolved.blastAssessment.morphologySupport.repeatedAcrossField, true);
  assert.equal(resolved.blastAssessment.blastoidSubpopulationContext.distinctFromMaturationContinuum, false);
  assert.equal(resolved.blastAssessment.blastoidSubpopulationContext.morphologicallyCoherent, false);
  assert.equal(resolved.blastAssessment.blastoidSubpopulationContext.repeatedSubsetAcrossField, false);
});

test('PASS 4 — 005.27.2 recovers physiologic precursor dominance after 005.31 correction', () => {
  const resolved = resolveMarrowNarrativeStructureContradiction(
    reconcileMarrowBlastEvidence(negativeMarrowCase()),
  );
  const discrimination = evaluateMarrowPrecursorDiscrimination(resolved);
  assert.equal(discrimination.classification, 'PHYSIOLOGIC_PRECURSOR_PATTERN');
  assert.equal(discrimination.strongPhysiologicPattern, true);
  assert.equal(discrimination.suppressBlastPromotion, true);
  assert.equal(discrimination.coherentBlastoidSubpopulation, false);
});

test('PASS 5 — strong OBSERVED positive blastoid population is never suppressed', () => {
  const resolved = resolveMarrowNarrativeStructureContradiction(truePositiveCase());
  assert.equal(resolved.blastAssessment.evidenceState, 'OBSERVED_POPULATION');
  assert.equal(resolved.blastAssessment.observed, true);
  assert.equal(resolved.marrowPhysiologicDominanceRecovery.active, false);
  assert.equal(resolved.marrowPhysiologicDominanceRecovery.positiveEvidenceProtected, true);
});

test('PASS 6 — independent blast cytology protects a suspicious positive case', () => {
  const input = truePositiveCase();
  input.blastAssessment.observed = null;
  input.blastAssessment.evidenceState = 'SUSPICIOUS_POPULATION';
  input.blastAssessment.approximateBlastLikeCells = 5;
  const resolved = resolveMarrowNarrativeStructureContradiction(input);
  assert.equal(resolved.blastAssessment.evidenceState, 'SUSPICIOUS_POPULATION');
  assert.equal(resolved.marrowPhysiologicDominanceRecovery.active, false);
  assert.equal(resolved.marrowPhysiologicDominanceRecovery.positiveEvidenceProtected, true);
});

test('PASS 7 — physiologic language alone cannot erase positive blast evidence', () => {
  const input = truePositiveCase();
  input.blastAssessment.summary += ' Há também continuidade maturativa no fundo medular.';
  const resolved = resolveMarrowNarrativeStructureContradiction(input);
  assert.equal(resolved.blastAssessment.evidenceState, 'OBSERVED_POPULATION');
  assert.equal(resolved.blastAssessment.blastoidSubpopulationContext.distinctFromMaturationContinuum, true);
});

test('PASS 8 — 005.31 reconciliation metadata records suppression and does not leave strong narrative blast evidence true', () => {
  const resolved = resolveMarrowNarrativeStructureContradiction(
    reconcileMarrowBlastEvidence(negativeMarrowCase()),
  );
  assert.equal(resolved.marrowBlastEvidenceReconciliation.strongNarrativeBlastoidEvidence, false);
  assert.equal(resolved.marrowBlastEvidenceReconciliation.suspiciousPromotionSuppressed, true);
  assert.equal(resolved.marrowPhysiologicDominanceRecovery.active, true);
});

test('PASS 9 — server integrates 005.31 before LME and exposes runtime fingerprints', () => {
  const server = fs.readFileSync(serverPath, 'utf8');
  const reconcilePos = server.indexOf('parsed = reconcileMarrowBlastEvidence(parsed)');
  const resolvePos = server.indexOf('parsed = resolveMarrowNarrativeStructureContradiction(parsed)');
  const lmePos = server.indexOf('let localMorphologyEvidence = createLocalMorphologyEvidence');
  assert.ok(reconcilePos >= 0);
  assert.ok(resolvePos > reconcilePos);
  assert.ok(lmePos > resolvePos);
  assert.match(server, /marrowNarrativeStructureContradictionVersion/);
  assert.match(server, /marrowPhysiologicDominanceRecoveryVersion/);
  assert.match(server, /BE-FIX-005\.31 — COERÊNCIA NARRATIVA-ESTRUTURA/);
});
