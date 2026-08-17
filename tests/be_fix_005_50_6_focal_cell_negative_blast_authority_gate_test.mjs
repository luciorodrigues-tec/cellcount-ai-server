import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
  evaluatePeripheralBlastoidCytologyAuthority,
  applyPeripheralBlastoidCytologyAuthority,
  applyPeripheralNegativeFindingAuthorityControl,
} from '../ai/peripheralBlastoidCytologyAuthorityEngine.js';

function sparseSingleCellResult() {
  return {
    findings: {
      blastSuspicion: false,
      blastEvidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
      focalHematopoieticCellObserved: true,
      focalImmatureCellState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
    },
    localMorphologyEvidence: {
      leukocytes: {
        hematopoieticCellCandidate: true,
        observedCellCount: 1,
        focalImmatureCellState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
        focalBlastoidCytology: {
          state: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          cellCount: 1,
          highNCRatio: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          openFineChromatin: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          nucleoli: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          scantBasophilicCytoplasm: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          largeCellSize: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
          featureCount: 0,
          evidence: 'Uma célula hematopoiética focal foi observada.',
        },
      },
      criticalMorphology: {},
    },
    negativeFindingScope: { items: [] },
  };
}

test('PASS 0 — 005.50.6 version is registered', () => {
  assert.equal(PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION, 'BE-FIX-005.50.6');
});

test('PASS 1 — one focal hematopoietic cell cannot authorize a hard field-level blast negative', () => {
  const d = evaluatePeripheralBlastoidCytologyAuthority(sparseSingleCellResult());
  assert.equal(d.focalOnlyField, true);
  assert.equal(d.focalNegativeAuthorityBlocked, true);
  assert.equal(d.effectiveState, 'NOT_ASSESSABLE');
  assert.equal(d.negativeBlastAuthorityAllowed, false);
  assert.equal(d.active, false);
});

test('PASS 2 — gate revokes the unsupported negative without fabricating blast suspicion', () => {
  const result = applyPeripheralBlastoidCytologyAuthority(sparseSingleCellResult());
  assert.equal(result.findings.focalHematopoieticCellObserved, true);
  assert.equal(result.findings.focalImmatureCellState, 'NOT_ASSESSABLE');
  assert.equal(result.findings.blastEvidenceState, 'NOT_ASSESSABLE');
  assert.equal(result.findings.blastSuspicion, false);
  assert.equal(result.normalityBlocked, true);
  assert.equal(result.requiresHumanReview, true);
});

test('PASS 3 — directly supported blastoid cytology still outranks the sparse-field negative gate', () => {
  const r = sparseSingleCellResult();
  Object.assign(r.localMorphologyEvidence.leukocytes.focalBlastoidCytology, {
    state: 'OBSERVED',
    highNCRatio: 'OBSERVED',
    openFineChromatin: 'OBSERVED',
    nucleoli: 'OBSERVED',
    featureCount: 3,
  });
  r.localMorphologyEvidence.leukocytes.focalImmatureCellState = 'OBSERVED';
  const result = applyPeripheralBlastoidCytologyAuthority(r);
  assert.equal(result.findings.blastSuspicion, true);
  assert.equal(result.findings.blastEvidenceState, 'OBSERVED');
  assert.equal(result.findings.observedBlastLikeCount, 1);
});

test('PASS 4 — multiple evaluated leukocytes retain legal field-level negative authority', () => {
  const r = sparseSingleCellResult();
  r.localMorphologyEvidence.leukocytes.observedCellCount = 8;
  r.localMorphologyEvidence.leukocytes.focalBlastoidCytology.cellCount = 8;
  const d = evaluatePeripheralBlastoidCytologyAuthority(r);
  assert.equal(d.focalOnlyField, false);
  assert.equal(d.focalNegativeAuthorityBlocked, false);
  assert.equal(d.effectiveState, 'NOT_OBSERVED_IN_EVALUABLE_FIELD');
  assert.equal(d.negativeBlastAuthorityAllowed, true);
});

test('PASS 5 — negative-finding authority exposes the focal-cell block for downstream audit', () => {
  let r = applyPeripheralBlastoidCytologyAuthority(sparseSingleCellResult());
  r = applyPeripheralNegativeFindingAuthorityControl(r);
  assert.equal(r.negativeFindingAuthority.focalNegativeAuthorityBlocked, true);
});
