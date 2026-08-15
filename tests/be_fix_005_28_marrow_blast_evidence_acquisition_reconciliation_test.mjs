import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION,
  assessMarrowNarrativeStructuredDiscordance,
  reconcileMarrowBlastEvidence,
} from '../ai/boneMarrow/marrowBlastEvidenceReconciliationEngine.js';

import {
  evaluateMarrowPrecursorDiscrimination,
} from '../ai/boneMarrow/marrowPrecursorDiscriminationEngine.js';

import {
  enforceBoneMarrowOutputContract,
} from '../ai/boneMarrow/boneMarrowOutputContract.js';

function base(overrides = {}) {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: {
      status: 'notAssessable',
      observed: null,
      evidenceState: 'NOT_ASSESSABLE',
      approximateBlastLikeCells: null,
      populationPattern: 'heterogeneous',
      morphologySupport: {
        highNCRatio: null,
        openFineChromatin: null,
        nucleoli: null,
        scantBasophilicCytoplasm: null,
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
        disproportionateImmatureSubset: null,
        matureFormsCoexist: true,
      },
      summary: '',
    },
    myeloidSeries: {
      status: 'present',
      maturation: 'heterogênea',
      summary: '',
    },
    ...overrides,
  };
}

test('PASS 0 — 005.28 reconciliation identity is registered', () => {
  assert.equal(MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION, 'BE-FIX-005.28');
});

test('PASS 1 — narrative/structured discordance is detected for repeated blastoid morphology', () => {
  const input = base();
  input.blastAssessment.summary =
    'Há múltiplas células imaturas/blastoides no campo, repetidas, algumas com relação N:C elevada, cromatina fina e citoplasma basofílico.';
  const d = assessMarrowNarrativeStructuredDiscordance(input);
  assert.equal(d.acquisitionEvidenceConflict, true);
  assert.equal(d.narrativeFeatureCount >= 3, true);
  assert.equal(d.repeatedLanguage, true);
});

test('PASS 2 — reconciliation restores only explicitly narrated morphology and repetition', () => {
  const input = base();
  input.blastAssessment.summary =
    'Há múltiplas células imaturas/blastoides no campo, repetidas, com relação N:C elevada, cromatina relativamente fina e citoplasma basofílico.';
  const out = reconcileMarrowBlastEvidence(input);
  assert.equal(out.blastAssessment.morphologySupport.highNCRatio, true);
  assert.equal(out.blastAssessment.morphologySupport.openFineChromatin, true);
  assert.equal(out.blastAssessment.morphologySupport.scantBasophilicCytoplasm, true);
  assert.equal(out.blastAssessment.morphologySupport.repeatedAcrossField, true);
  assert.equal(out.blastAssessment.morphologySupport.nucleoli, null);
  assert.equal(out.blastAssessment.evidenceState, 'SUSPICIOUS_POPULATION');
  assert.equal(out.blastAssessment.populationPattern, 'repeated');
});

test('PASS 3 — reconciled positive signal reaches 005.27.2 suspicious dual-axis escalation', () => {
  const input = base();
  input.blastAssessment.summary =
    'Há múltiplas células imaturas/blastoides repetidas ao longo do campo, com relação N:C elevada, cromatina fina e citoplasma basofílico.';
  const reconciled = reconcileMarrowBlastEvidence(input);
  const d = evaluateMarrowPrecursorDiscrimination(reconciled);
  assert.equal(d.dualAxis.suspiciousEscalation, true);
  assert.equal(d.classification, 'BLASTOID_PATTERN_SUPPORTED');
});

test('PASS 4 — physiologic maturation narrative is not promoted to blastoid evidence', () => {
  const input = base();
  input.blastAssessment.summary =
    'Precursores hematopoéticos em diferentes estágios, com continuidade maturativa, coexistindo com formas maduras. Não se identifica subpopulação blastoide distinta.';
  const out = reconcileMarrowBlastEvidence(input);
  assert.notEqual(out.blastAssessment.evidenceState, 'SUSPICIOUS_POPULATION');
  assert.equal(out.marrowBlastEvidenceReconciliation.acquisitionEvidenceConflict, false);
});

test('PASS 5 — isolated N:C/chromatin language without repeated blastoid population remains non-promoting', () => {
  const input = base();
  input.blastAssessment.summary =
    'Alguns precursores fisiológicos apresentam relação N:C elevada e cromatina aberta, dentro de continuidade maturativa.';
  const out = reconcileMarrowBlastEvidence(input);
  assert.equal(out.marrowBlastEvidenceReconciliation.strongNarrativeBlastoidEvidence, false);
  assert.equal(out.blastAssessment.evidenceState, 'NOT_ASSESSABLE');
});

test('PASS 6 — explicit observed structured population is preserved without downgrade', () => {
  const input = base();
  input.blastAssessment.evidenceState = 'OBSERVED_POPULATION';
  input.blastAssessment.observed = true;
  input.blastAssessment.populationPattern = 'repeated';
  input.blastAssessment.morphologySupport = {
    highNCRatio: true,
    openFineChromatin: true,
    nucleoli: true,
    scantBasophilicCytoplasm: true,
    monomorphism: true,
    repeatedAcrossField: true,
  };
  input.blastAssessment.summary = 'População blastoide repetida e morfologicamente coerente.';
  const out = reconcileMarrowBlastEvidence(input);
  assert.equal(out.blastAssessment.evidenceState, 'OBSERVED_POPULATION');
  assert.equal(out.blastAssessment.observed, true);
});

test('PASS 7 — output contract preserves 005.28 reconciliation metadata', () => {
  const input = base();
  input.blastAssessment.summary =
    'Múltiplas células imaturas/blastoides repetidas com relação N:C elevada, cromatina fina e citoplasma basofílico.';
  const reconciled = reconcileMarrowBlastEvidence(input);
  const out = enforceBoneMarrowOutputContract(reconciled, {
    rawResult: reconciled,
    specimenGate: { specimenType: 'BONE_MARROW_ASPIRATE' },
  });
  assert.equal(out.blastAssessment.reconciliationVersion, 'BE-FIX-005.28');
  assert.equal(out.blastAssessment.reconciledFromObservationNarrative, true);
  assert.equal(out.blastAssessment.evidenceReconciliation.acquisitionEvidenceConflict, true);
});

test('PASS 8 — server applies reconciliation before LME and exposes 005.28 runtime fingerprint', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  const reconcileIndex = source.indexOf('parsed = reconcileMarrowBlastEvidence(parsed)');
  const lmeIndex = source.indexOf('let localMorphologyEvidence = createLocalMorphologyEvidence');
  assert.ok(reconcileIndex > 0 && lmeIndex > reconcileIndex);
  assert.match(source, /marrowBlastEvidenceReconciliationVersion:\s*\n\s*MARROW_BLAST_EVIDENCE_RECONCILIATION_VERSION/);
});

test('PASS 9 — marrow prompt requires coherent structured acquisition and unknown-not-false semantics', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /BE-FIX-005\.28 — REFORÇO DA AQUISIÇÃO DE EVIDÊNCIA BLASTOIDE MEDULAR/);
  assert.match(source, /false significa: característica suficientemente avaliável e realmente NÃO observada/);
  assert.match(source, /approximateImmatureCellCount/);
  assert.match(source, /immatureCellBurden/);
  assert.match(source, /spatialDistribution/);
  assert.match(source, /morphologicFeatureCount/);
});
