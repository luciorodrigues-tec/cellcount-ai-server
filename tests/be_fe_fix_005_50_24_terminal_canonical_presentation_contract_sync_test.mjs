import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCanonicalClinicalPresentation,
  CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION,
  CANONICAL_CLINICAL_PRESENTATION_CONTRACT_SYNC_VERSION,
  CANONICAL_CLINICAL_PRESENTATION_FOCAL_SCOPE_UI_LOCK_VERSION,
} from '../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js';

test('005.50.24 fingerprints are registered', () => {
  assert.equal(CANONICAL_CLINICAL_PRESENTATION_AUTHORITY_VERSION, 'BE/FE-FIX-005.50.24');
  assert.equal(CANONICAL_CLINICAL_PRESENTATION_CONTRACT_SYNC_VERSION, 'BE/FE-FIX-005.50.24');
  assert.equal(CANONICAL_CLINICAL_PRESENTATION_FOCAL_SCOPE_UI_LOCK_VERSION, 'BE/FE-FIX-005.50.24');
});

test('focal marrow provenance is exported as non-population canonical policy', () => {
  const result = {
    marrowFocalBlastoidAuthorityProvenance: {
      locked: true, focalCellLevelPositive: true,
      independentPopulationEvidenceState: null,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      focalBlastoidFindingDoesNotEstablishPopulation: true,
      source: 'BE-FIX-005.50.18_TRUSTED_CELL_LEVEL_CYTOLOGY',
    },
    clinicalResultV2: {
      scope: { limitedField: true },
      criticalFindings: { blastLike: { state: 'OBSERVED', evidence: ['focal blastoid cell'] } },
      review: { required: true },
      provenance: { craVersion: 'CRA-001.1' },
    },
  };
  const p = buildCanonicalClinicalPresentation(result);
  assert.equal(p.contractVersion, 'BE/FE-FIX-005.50.24');
  assert.equal(p.presentationPolicy.focalBlastoidFindingDoesNotEstablishPopulation, true);
  assert.equal(p.presentationPolicy.cellLevelPositiveBlastoidCytology, true);
  assert.equal(p.presentationPolicy.populationEvidenceEstablished, false);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, false);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, false);
  assert.equal(p.presentationPolicy.contractSynchronizationVersion, 'BE/FE-FIX-005.50.24');
});

test('qualified population provenance preserves population permissions', () => {
  const result = {
    marrowFocalBlastoidAuthorityProvenance: {
      locked: false, focalCellLevelPositive: false,
      independentPopulationEvidenceState: 'OBSERVED_POPULATION',
      populationInferenceAllowed: true,
      populationPositiveAllowed: true,
      blastPercentageInferenceAllowed: true,
      focalBlastoidFindingDoesNotEstablishPopulation: false,
      source: 'INDEPENDENT_QUALIFIED_POPULATION_EVIDENCE',
    },
    blastAssessment: { evidenceState: 'OBSERVED_POPULATION' },
    clinicalResultV2: { scope: { limitedField: false }, criticalFindings: { blastLike: { state: 'OBSERVED' } }, review: {} },
  };
  const p = buildCanonicalClinicalPresentation(result);
  assert.equal(p.presentationPolicy.populationEvidenceEstablished, true);
  assert.equal(p.presentationPolicy.populationInferenceAllowed, true);
  assert.equal(p.presentationPolicy.populationPositiveAllowed, true);
  assert.equal(p.presentationPolicy.blastPercentageInferenceAllowed, true);
});
