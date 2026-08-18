import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION,
  MARROW_BLASTOID_CELL_SAMPLING_AUTHORITY_VERSION,
  MARROW_MATURATION_COEXISTENCE_NON_SUPPRESSION_VERSION,
  MARROW_POSITIVE_CYTOLOGY_POPULATION_SEPARATION_VERSION,
  applyMarrowTrueAmlPositiveCytomorphologyRecovery,
} from '../ai/boneMarrow/marrowTrueAmlPositiveCytomorphologyRecoveryEngine.js';

import {
  evaluateMarrowPositiveBlastEvidenceSemanticSupersession,
} from '../ai/boneMarrow/marrowPositiveBlastEvidenceSemanticSupersessionEngine.js';

function baseMarrow() {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    marrowAdequacy: { status: 'indeterminate' },
    myeloidSeries: {
      status: 'present',
      expansionContext: {
        broadMaturationSpectrum: true,
        matureNeutrophilicFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
      },
    },
    blastAssessment: {
      status: 'indeterminate',
      observed: null,
      evidenceState: 'NOT_ASSESSABLE',
      approximateBlastLikeCells: null,
      precursorContext: {
        maturationContinuum: true,
        matureFormsPresent: true,
        maturationHeterogeneity: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: null,
        matureFormsCoexist: true,
      },
      morphologySupport: {},
      immatureCellCytology: {},
      blastoidCellSampling: {
        sampledCellCount: 0,
        blastoidQualifiedCellCount: 0,
        assessedCells: [],
      },
    },
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
  };
}

function amlLikeSample() {
  const r = baseMarrow();
  r.blastAssessment.blastoidCellSampling = {
    sampledCellCount: 3,
    blastoidQualifiedCellCount: 2,
    assessedCells: [
      { cellIndex: 1, highNCRatio: true, openFineChromatin: true, nucleoli: true, scantBasophilicCytoplasm: null, distinctFromMaturationContinuum: true, morphologicallyCoherent: true, repeatedWithSimilarCells: true },
      { cellIndex: 2, highNCRatio: true, openFineChromatin: true, nucleoli: null, scantBasophilicCytoplasm: true, distinctFromMaturationContinuum: true, morphologicallyCoherent: true, repeatedWithSimilarCells: true },
      { cellIndex: 3, highNCRatio: false, openFineChromatin: false, nucleoli: false, scantBasophilicCytoplasm: false, distinctFromMaturationContinuum: false, morphologicallyCoherent: false, repeatedWithSimilarCells: false },
    ],
  };
  return r;
}

test('PASS 0 — 005.50.18 fingerprints are registered', () => {
  assert.equal(MARROW_TRUE_AML_POSITIVE_CYTOMORPHOLOGY_RECOVERY_VERSION, 'BE-FIX-005.50.18');
  assert.equal(MARROW_BLASTOID_CELL_SAMPLING_AUTHORITY_VERSION, 'BE-FIX-005.50.18');
  assert.equal(MARROW_MATURATION_COEXISTENCE_NON_SUPPRESSION_VERSION, 'BE-FIX-005.50.18');
  assert.equal(MARROW_POSITIVE_CYTOLOGY_POPULATION_SEPARATION_VERSION, 'BE-FIX-005.50.18');
});

test('PASS 1 — AML-like sentinel cytology is not allowed to remain physiologic/negative', () => {
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(amlLikeSample());
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.active, true);
  assert.equal(out.blastAssessment.evidenceState, 'FOCAL_SUSPICION');
  assert.equal(out.findings.blastSuspicion, true);
});

test('PASS 2 — mature granulocytic forms do not suppress independently positive blastoid cytology', () => {
  const input = amlLikeSample();
  input.marrowMyeloidExpansionDiscrimination = {
    classification: 'PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION',
    pathologicMyeloidExpansionSupported: true,
  };
  input.marrowPathologicMaturationContinuumLock = { active: true };
  const recovered = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  const decision = evaluateMarrowPositiveBlastEvidenceSemanticSupersession(recovered);
  assert.equal(decision.truePositiveCytologyProtected, true);
  assert.equal(decision.active, false);
  assert.equal(decision.supersessionMode, 'TRUE_POSITIVE_CYTOLOGY_PROTECTED_FROM_MATURATION_SUPERSESSION');
});

test('PASS 3 — multiple concordant cell-level traits establish positive blastoid cytology', () => {
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(amlLikeSample());
  const d = out.marrowTrueAmlPositiveCytomorphologyRecovery;
  assert.ok(d.sampledBlastoidCellCount >= 2);
  assert.equal(d.cellLevelPositiveCytology, true);
});

test('PASS 4 — cell-level positivity never manufactures population architecture or blast percentage', () => {
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(amlLikeSample());
  assert.equal(out.blastAssessment.evidenceState, 'FOCAL_SUSPICION');
  assert.equal(out.blastAssessment.observed, false);
  assert.equal(out.blastAssessment.estimatedPercentage, null);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.populationPositiveFabricated, false);
  assert.equal(out.evidenceGovernance.populationPositiveAllowed, false);
  assert.equal(out.evidenceGovernance.blastPercentageInferenceAllowed, false);
});

test('PASS 5 — physiologic precursor control remains non-positive', () => {
  const input = baseMarrow();
  input.blastAssessment.blastoidCellSampling = {
    sampledCellCount: 3,
    blastoidQualifiedCellCount: 0,
    assessedCells: [
      { highNCRatio: true, openFineChromatin: false, nucleoli: false, scantBasophilicCytoplasm: false, distinctFromMaturationContinuum: false },
      { highNCRatio: false, openFineChromatin: false, nucleoli: false, scantBasophilicCytoplasm: false, distinctFromMaturationContinuum: false },
      { highNCRatio: false, openFineChromatin: false, nucleoli: false, scantBasophilicCytoplasm: false, distinctFromMaturationContinuum: false },
    ],
  };
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.active, false);
  assert.equal(out.blastAssessment.evidenceState, 'NOT_ASSESSABLE');
});

test('PASS 6 — unresolved cells with unassessable traits remain unresolved and are not promoted', () => {
  const input = baseMarrow();
  input.blastAssessment.evidenceState = 'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY';
  input.blastAssessment.blastoidCellSampling = {
    sampledCellCount: 2,
    blastoidQualifiedCellCount: 0,
    assessedCells: [{ highNCRatio: null, openFineChromatin: null, nucleoli: null, scantBasophilicCytoplasm: null }, { highNCRatio: null, openFineChromatin: null, nucleoli: null, scantBasophilicCytoplasm: null }],
  };
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.active, false);
  assert.equal(out.blastAssessment.evidenceState, 'FOCAL_UNRESOLVED_IMMATURE_CYTOLOGY');
});

test('PASS 7 — a single blastoid cell remains focal and never becomes a population', () => {
  const input = baseMarrow();
  input.blastAssessment.blastoidCellSampling = {
    sampledCellCount: 1,
    blastoidQualifiedCellCount: 1,
    assessedCells: [{ highNCRatio: true, openFineChromatin: true, nucleoli: true, scantBasophilicCytoplasm: null, distinctFromMaturationContinuum: true }],
  };
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  assert.equal(out.blastAssessment.evidenceState, 'FOCAL_SUSPICION');
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.populationPromotionAllowedByThisEngine, false);
});

test('PASS 8 — limited field blocks population/percentage inference while preserving focal positive cytology', () => {
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(amlLikeSample());
  assert.equal(out.fieldAdequacy.populationInferenceAllowed, false);
  assert.equal(out.blastAssessment.evidenceState, 'FOCAL_SUSPICION');
  assert.equal(out.evidenceGovernance.blastPercentageInferenceAllowed, false);
});

test('PASS 9 — pre-existing OBSERVED_POPULATION remains protected and is not downgraded', () => {
  const input = amlLikeSample();
  input.blastAssessment.evidenceState = 'OBSERVED_POPULATION';
  input.blastAssessment.observed = true;
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.active, false);
  assert.equal(out.blastAssessment.evidenceState, 'OBSERVED_POPULATION');
  assert.equal(out.blastAssessment.observed, true);
});

test('PASS 10 — known diagnosis is not an input signal and cannot fabricate cytology', () => {
  const input = baseMarrow();
  input.knownDiagnosis = 'LMA';
  input.clinicalContext = 'AML';
  const out = applyMarrowTrueAmlPositiveCytomorphologyRecovery(input);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.active, false);
  assert.equal(out.marrowTrueAmlPositiveCytomorphologyRecovery.diagnosisAllowedByThisEngine, false);
});

test('PASS 11 — server integrates and exposes 005.50.18 runtime fingerprints', () => {
  const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(server, /applyMarrowTrueAmlPositiveCytomorphologyRecovery\(parsed\)/);
  assert.match(server, /marrowTrueAmlPositiveCytomorphologyRecoveryVersion/);
  assert.match(server, /marrowBlastoidCellSamplingAuthorityVersion/);
  assert.match(server, /marrowMaturationCoexistenceNonSuppressionVersion/);
  assert.match(server, /marrowPositiveCytologyPopulationSeparationVersion/);
  assert.match(server, /marrowBlastoidCellSamplingAcquisitionVersion/);
});
