import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateMarrowMyeloidExpansion,
  applyMarrowMyeloidExpansionDiscrimination,
  MARROW_POPULATION_INFERENCE_REPRESENTATIVITY_GATE_VERSION,
} from '../ai/boneMarrow/marrowMyeloidExpansionDiscriminationEngine.js';

import {
  evaluateMarrowMyeloproliferativePatternCriticality,
  MARROW_POPULATION_CRITICALITY_REPRESENTATIVITY_GATE_VERSION,
} from '../ai/boneMarrow/marrowMyeloproliferativePatternCriticalityEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function strongExpansion(overrides = {}) {
  return {
    specimenType: 'BONE_MARROW',
    blastAssessment: {
      observed: false,
      evidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
      approximateImmatureCellCount: 14,
      precursorContext: {
        maturationContinuum: true,
        matureFormsPresent: true,
      },
    },
    myeloidSeries: {
      maturation: 'present',
      expansionContext: {
        relativeMyeloidPredominance: true,
        disproportionateMyeloidRepresentation: true,
        numerousGranulocyticPrecursors: true,
        broadMaturationSpectrum: true,
        matureNeutrophilicFormsPresent: true,
        leftShiftedMaturationSpectrum: true,
        denseMyeloidField: true,
      },
    },
    ...overrides,
  };
}

test('PASS 0 — 005.50.11 representativity gates are registered', () => {
  assert.equal(MARROW_POPULATION_INFERENCE_REPRESENTATIVITY_GATE_VERSION, 'BE-FIX-005.50.11');
  assert.equal(MARROW_POPULATION_CRITICALITY_REPRESENTATIVITY_GATE_VERSION, 'BE-FIX-005.50.11');
});

test('PASS 1 — limited field cannot prove population-level pathologic myeloid expansion', () => {
  const r = evaluateMarrowMyeloidExpansion(strongExpansion({
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
  }));
  assert.equal(r.populationInferenceAllowed, false);
  assert.equal(r.pathologicMyeloidExpansionSupported, false);
  assert.notEqual(r.classification, 'PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION');
});

test('PASS 2 — non-representative field does not create the pathologic maturation lock', () => {
  const out = applyMarrowMyeloidExpansionDiscrimination(strongExpansion({
    fieldAdequacy: { adequateForPopulationAssessment: false },
  }));
  assert.equal(out.marrowMyeloidExpansionDiscrimination.pathologicMyeloidExpansionSupported, false);
  assert.equal(out.marrowPathologicMaturationContinuumLock, undefined);
});

test('PASS 3 — explicitly adequate population field preserves true positive expansion sensitivity', () => {
  const r = evaluateMarrowMyeloidExpansion(strongExpansion({
    fieldAdequacy: { limitedField: false, adequateForPopulationAssessment: true },
  }));
  assert.equal(r.populationInferenceAllowed, true);
  assert.equal(r.pathologicMyeloidExpansionSupported, true);
  assert.equal(r.classification, 'PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION');
});

test('PASS 4 — legacy cases without adequacy metadata preserve prior positive behavior', () => {
  const r = evaluateMarrowMyeloidExpansion(strongExpansion());
  assert.equal(r.populationInferenceAllowed, true);
  assert.equal(r.pathologicMyeloidExpansionSupported, true);
});

test('PASS 5 — criticality engine independently blocks stale protected expansion in limited field', () => {
  const base = applyMarrowMyeloidExpansionDiscrimination(strongExpansion({
    fieldAdequacy: { adequateForPopulationAssessment: true },
  }));
  base.fieldAdequacy = { limitedField: true, adequateForPopulationAssessment: false };
  const d = evaluateMarrowMyeloproliferativePatternCriticality(base);
  assert.equal(d.populationInferenceAllowed, false);
  assert.equal(d.protectedExpansion, false);
  assert.equal(d.active, false);
  assert.equal(d.myeloproliferativePatternSupported, false);
  assert.equal(d.bcrAbl1RecommendationGate, 'NOT_TRIGGERED');
});

test('PASS 6 — representativity gate does not suppress structured blast authority', () => {
  const input = strongExpansion({
    fieldAdequacy: { limitedField: true, adequateForPopulationAssessment: false },
    finalMarrowAuthority: { structuredBlast: { observed: true, suspicious: true, structured: true } },
  });
  const d = evaluateMarrowMyeloproliferativePatternCriticality(input);
  assert.equal(d.structuredBlastAuthority.observed, true);
  assert.equal(d.structuredBlastAuthority.suspicious, true);
  assert.equal(d.active, false);
});

test('PASS 7 — server exposes both 005.50.11 runtime fingerprints', () => {
  const source = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(source, /marrowPopulationInferenceRepresentativityGateVersion/);
  assert.match(source, /marrowPopulationCriticalityRepresentativityGateVersion/);
  assert.match(source, /MARROW_POPULATION_INFERENCE_REPRESENTATIVITY_GATE_VERSION/);
  assert.match(source, /MARROW_POPULATION_CRITICALITY_REPRESENTATIVITY_GATE_VERSION/);
});
