import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyMarrowPositiveCellLevelBlastoidScopeLock,
  evaluateMarrowPositiveCellLevelBlastoidScopeLock,
  MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
  MARROW_FOCAL_BLASTOID_POPULATION_ANTI_PROMOTION_VERSION,
  MARROW_BLAST_PERCENTAGE_SCOPE_LOCK_VERSION,
  MARROW_TERMINAL_FOCAL_BLASTOID_PRESENTATION_COHERENCE_VERSION,
} from '../ai/boneMarrow/marrowPositiveCellLevelBlastoidScopeLockEngine.js';

import analyzeGlobalPattern from '../ai/globalPatternEngine.js';
import { applyFinalMarrowAuthority } from '../ai/boneMarrow/marrowFinalClinicalAuthorityEngine.js';
import { applyMarrowMorphologyAdequacyProjectionLock } from '../ai/boneMarrow/marrowMorphologyAdequacyProjectionLockEngine.js';
import { applyCanonicalClinicalPresentationAuthority } from '../ai/clinicalResultV2/canonicalClinicalPresentationAuthority.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function focalPositive(overrides = {}) {
  return {
    rawResponse: {
      blastAssessment: {
        evidenceState: 'FOCAL_SUSPICION',
        approximateBlastLikeCells: 2,
      },
    },
    blastAssessment: {
      evidenceState: 'FOCAL_SUSPICION',
      approximateBlastLikeCells: 2,
    },
    findings: {
      blastSuspicion: true,
      immatureCells: true,
      blastEvidenceState: 'FOCAL_SUSPICION',
    },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      version: 'BE-FIX-005.50.18',
      active: true,
      priorEvidenceState: 'FOCAL_SUSPICION',
      cellLevelPositiveCytology: true,
      independentlyBlastoidCellCount: 2,
      populationPromotionAllowedByThisEngine: false,
    },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    evidenceGovernance: {
      cellLevelPositiveBlastoidCytology: true,
      populationInferenceAllowed: false,
      blastPercentageInferenceAllowed: false,
    },
    marrowMyeloidExpansionDiscrimination: {
      populationInferenceAllowed: false,
      populationInferenceRepresentativity: {
        populationInferenceAllowed: false,
      },
    },
    marrowRecoveredCytologyProjection: {
      evidenceState: 'FOCAL_SUSPICION',
      structuredPositive: true,
      architectureQualified: true,
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
    },
    marrowPositiveBlastEvidenceLock: {
      active: true,
      positiveEvidencePresent: true,
      positiveEvidencePreserved: true,
    },
    marrowMaturationContinuumDiscrimination: {
      classification: 'PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED',
      observedStructuredPopulation: true,
      structuredPathologicSubset: true,
    },
    marrowPositiveBlastEvidenceSemanticSupersession: {
      active: false,
      priorEvidenceState: 'FOCAL_SUSPICION',
      populationInferenceAllowed: false,
      populationPositiveAllowed: true,
      suspiciousArchitectureQualified: true,
    },
    morphologyAnalysis: {
      overview: 'Campo medular limitado.',
      summary: 'Citomorfologia blastoide focal.',
    },
    overallAssessment: { requiresHumanReview: true },
    structuredReport: {},
    patternRecognition: {},
    clinicalResultV2: {
      criticalFindings: {
        blastLike: {
          state: 'SUSPICIOUS_INDETERMINATE',
          evidence: ['Duas células com citomorfologia blastoide.'],
        },
      },
      scope: { limitedField: true },
      review: { required: true },
      risk: { severity: 'HIGH' },
      presentation: {},
      lineages: { erythrocytes: { positiveMorphology: {} } },
      quality: { limitations: ['Campo limitado.'] },
      provenance: { craVersion: 'CRA-001.1' },
    },
    ...overrides,
  };
}

test('PASS 0 — 005.50.19 fingerprints are registered', () => {
  assert.equal(MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION, 'BE-FIX-005.50.19');
  assert.equal(MARROW_FOCAL_BLASTOID_POPULATION_ANTI_PROMOTION_VERSION, 'BE-FIX-005.50.19');
  assert.equal(MARROW_BLAST_PERCENTAGE_SCOPE_LOCK_VERSION, 'BE-FIX-005.50.19');
  assert.equal(MARROW_TERMINAL_FOCAL_BLASTOID_PRESENTATION_COHERENCE_VERSION, 'BE-FIX-005.50.19');
});

test('PASS 1 — focal positive cell-level cytology activates scope lock when population inference is forbidden', () => {
  const d = evaluateMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  assert.equal(d.active, true);
  assert.equal(d.originEvidenceState, 'FOCAL_SUSPICION');
  assert.equal(d.cellLevelPositiveBlastoidCytology, true);
  assert.equal(d.populationInferenceForbidden, true);
});

test('PASS 2 — focal positive cytology is preserved while derived population positivity is revoked', () => {
  const out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(out.findings.cellLevelPositiveBlastoidCytology, true);
  assert.equal(out.findings.blastEvidenceState, 'FOCAL_SUSPICION');
  assert.equal(out.evidenceGovernance.populationPositiveAllowed, false);
  assert.equal(out.marrowRecoveredCytologyProjection.structuredPositive, false);
  assert.equal(out.marrowPositiveBlastEvidenceLock.active, false);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_FOCAL_SUSPICION');
});

test('PASS 3 — blast percentage inference remains forbidden in limited focal-positive scope', () => {
  const out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  assert.equal(out.evidenceGovernance.blastPercentageInferenceAllowed, false);
  assert.equal(out.evidenceGovernance.populationInferenceAllowed, false);
});

test('PASS 4 — global pattern cannot call a focal positive cytology a blastoid population', () => {
  let out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  out.globalPattern = analyzeGlobalPattern(out);
  assert.equal(out.globalPattern.dominantPattern, 'MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN');
  assert.notEqual(out.globalPattern.dominantPattern, 'MARROW_POSITIVE_BLASTOID_POPULATION_PATTERN');
  assert.equal(out.globalPattern.marrowPositiveBlastoidCytology, true);
  assert.equal(out.globalPattern.marrowPopulationBlastEvidence, false);
});

test('PASS 5 — final marrow authority cannot resurrect a suspicious population from focal scoped cytology', () => {
  let out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  out = applyFinalMarrowAuthority(out);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_FOCAL_SUSPICION');
  assert.equal(out.finalMarrowAuthority.structuredBlast.suspicious, false);
  assert.equal(out.finalMarrowAuthority.structuredBlast.structured, false);
  assert.equal(out.finalMarrowAuthority.structuredBlast.populationPositiveAllowed, false);
});

test('PASS 6 — morphology/adequacy projection preserves focal morphology without promoting population', () => {
  let out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  out = applyFinalMarrowAuthority(out);
  out = applyMarrowMorphologyAdequacyProjectionLock(out);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_FOCAL_SUSPICION');
  assert.equal(out.marrowTerminalMorphologyAdequacyProjectionLock.populationPositiveAllowed, false);
  assert.equal(out.marrowTerminalMorphologyAdequacyProjectionLock.focalCytologyPopulationScopeLocked, true);
});

test('PASS 7 — canonical presentation states focal positivity and forbids population/percentage inference', () => {
  let out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  out = applyCanonicalClinicalPresentationAuthority(out);
  out = applyMarrowPositiveCellLevelBlastoidScopeLock(out);
  assert.equal(out.clinicalPresentation.presentationPolicy.focalBlastoidFindingDoesNotEstablishPopulation, true);
  assert.equal(out.clinicalPresentation.presentationPolicy.blastPercentageInferenceAllowed, false);
  assert.equal(out.clinicalPresentation.presentationPolicy.populationInferenceAllowed, false);
  assert.equal(out.clinicalPresentation.presentationPolicy.populationPositiveAllowed, false);
  assert.match(out.clinicalPresentation.headline.title, /Citomorfologia blastoide focal positiva/i);
});

test('PASS 8 — true OBSERVED_POPULATION remains protected and is never downgraded by 005.50.19', () => {
  const input = focalPositive({
    rawResponse: { blastAssessment: { evidenceState: 'OBSERVED_POPULATION', approximateBlastLikeCells: 20 } },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      active: true,
      priorEvidenceState: 'OBSERVED_POPULATION',
      cellLevelPositiveCytology: true,
    },
    marrowBlastPopulationEvidence: {
      evidenceState: 'OBSERVED_POPULATION',
      observedPopulation: true,
    },
  });
  const d = evaluateMarrowPositiveCellLevelBlastoidScopeLock(input);
  assert.equal(d.active, false);
  assert.equal(d.trueObservedPopulationProtected, true);
});

test('PASS 9 — pre-existing SUSPICIOUS_POPULATION is outside the focal anti-promotion path', () => {
  const input = focalPositive({
    rawResponse: { blastAssessment: { evidenceState: 'SUSPICIOUS_POPULATION' } },
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      active: true,
      priorEvidenceState: 'SUSPICIOUS_POPULATION',
      cellLevelPositiveCytology: true,
    },
  });
  const d = evaluateMarrowPositiveCellLevelBlastoidScopeLock(input);
  assert.equal(d.active, false);
  assert.equal(d.preExistingSuspiciousPopulationProtected, true);
});

test('PASS 10 — physiologic marrow without positive blastoid cytology is not destabilized', () => {
  const input = focalPositive({
    marrowTrueAmlPositiveCytomorphologyRecovery: {
      active: false,
      priorEvidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
      cellLevelPositiveCytology: false,
    },
    evidenceGovernance: { populationInferenceAllowed: false, cellLevelPositiveBlastoidCytology: false },
    rawResponse: { blastAssessment: { evidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD' } },
    blastAssessment: { evidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD' },
  });
  const out = applyMarrowPositiveCellLevelBlastoidScopeLock(input);
  assert.equal(out.marrowPositiveCellLevelBlastoidScopeLock.active, false);
  assert.notEqual(out.finalClassification, 'MARROW_BLASTOID_FOCAL_SUSPICION');
});

test('PASS 11 — 005.50.19 never creates diagnosis or lineage assignment', () => {
  const out = applyMarrowPositiveCellLevelBlastoidScopeLock(focalPositive());
  assert.equal(out.marrowPositiveCellLevelBlastoidScopeLock.diagnosisAllowedByThisEngine, false);
  assert.equal(out.diagnosis, undefined);
  assert.equal(out.lineage, undefined);
});

test('PASS 12 — server integrates terminal reapplication and runtime fingerprints', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(server, /marrowPositiveCellLevelBlastoidScopePreservationVersion/);
  assert.match(server, /marrowFocalBlastoidPopulationAntiPromotionVersion/);
  assert.match(server, /marrowBlastPercentageScopeLockVersion/);
  assert.match(server, /marrowTerminalFocalBlastoidPresentationCoherenceVersion/);
  const calls = (server.match(/applyMarrowPositiveCellLevelBlastoidScopeLock\(/g) || []).length;
  assert.ok(calls >= 6, `expected repeated scope lock integration, found ${calls}`);
});
