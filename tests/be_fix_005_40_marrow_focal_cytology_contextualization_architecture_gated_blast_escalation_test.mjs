import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const projectionModule = await import(pathToFileURL(path.join(root, 'ai/boneMarrow/marrowRecoveredCytologyProjectionEngine.js')));
const precursorModule = await import(pathToFileURL(path.join(root, 'ai/boneMarrow/marrowPrecursorDiscriminationEngine.js')));

const {
  MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION,
  readRecoveredMarrowBlastEvidence,
  applyMarrowRecoveredCytologyProjection,
} = projectionModule;

const {
  MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION,
  evaluateMarrowPrecursorDiscrimination,
  applyMarrowPrecursorDiscrimination,
} = precursorModule;

function pathologicExpansionFixture(overrides = {}) {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    marrowPathologicMaturationContinuumLock: {
      version: 'BE-FIX-005.38',
      active: true,
      classification: 'PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION',
      blastoidPopulationSupported: false,
    },
    marrowPositiveCytologyConsistency: {
      version: 'BE-FIX-005.35',
      active: true,
      unresolvedPositiveCytology: true,
    },
    blastAssessment: {
      evidenceState: 'positiveMorphologicSuspicionForRepeatedImmatureBlastLikeCells',
      approximateBlastLikeCells: 0,
      approximateImmatureCellCount: 0,
      populationPattern: 'repeatedsubsetwithinmixedmarrowpopulation',
      spatialDistribution: 'repeated_across_field',
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        monomorphism: false,
        repeatedAcrossField: true,
      },
      immatureCellCytology: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: true,
        distinctFromMaturationContinuum: false,
      },
      precursorContext: {
        maturationContinuum: true,
        matureFormsPresent: true,
        orderlyGranulocyticMaturation: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: false,
        morphologicallyCoherent: false,
        repeatedSubsetAcrossField: true,
        disproportionateImmatureSubset: false,
        matureFormsCoexist: true,
      },
      ...overrides,
    },
    findings: {},
  };
}

function trueBlastFixture() {
  return {
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: {
      evidenceState: 'OBSERVED_POPULATION',
      observed: true,
      approximateBlastLikeCells: 7,
      populationPattern: 'repeated',
      spatialDistribution: 'repeated_across_field',
      morphologySupport: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        monomorphism: true,
        repeatedAcrossField: true,
      },
      immatureCellCytology: {
        highNCRatio: true,
        openFineChromatin: true,
        nucleoli: true,
        scantBasophilicCytoplasm: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
        distinctFromMaturationContinuum: true,
      },
      blastoidSubpopulationContext: {
        distinctFromMaturationContinuum: true,
        morphologicallyCoherent: true,
        repeatedSubsetAcrossField: true,
        disproportionateImmatureSubset: true,
        matureFormsCoexist: true,
      },
      precursorContext: {
        maturationContinuum: true,
        matureFormsPresent: true,
      },
    },
    findings: {},
  };
}

test('PASS 0 — 005.40 identities are registered', () => {
  assert.equal(MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION, 'BE-FIX-005.40');
  assert.equal(MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION, 'BE-FIX-005.40');
});

test('PASS 1 — four cytology traits with zero blast-like cells do not become structured positive in protected myeloid expansion', () => {
  const e = readRecoveredMarrowBlastEvidence(pathologicExpansionFixture());
  assert.equal(e.positiveCytologyCount, 4);
  assert.equal(e.blastLikeCount, 0);
  assert.equal(e.pathologicMyeloidExpansionLock, true);
  assert.equal(e.architectureQualified, false);
  assert.equal(e.structuredPositive, false);
});

test('PASS 2 — 005.34 positive E2E lock is not fabricated from cytology-only precursor repair', () => {
  const result = applyMarrowRecoveredCytologyProjection(pathologicExpansionFixture());
  assert.notEqual(result.marrowPositiveBlastEvidenceLock?.active, true);
  assert.notEqual(result.findings?.blastSuspicion, true);
  assert.notEqual(result.blastAssessment?.evidenceState, 'SUSPICIOUS_POPULATION');
});

test('PASS 3 — pathologic expansion blocks suspicious escalation when there is no blastoid subpopulation core', () => {
  const d = evaluateMarrowPrecursorDiscrimination(pathologicExpansionFixture());
  assert.equal(d.pathologicMyeloidExpansionProtected, true);
  assert.equal(d.coherentBlastoidSubpopulation, false);
  assert.equal(d.cytologyOnlyEscalationBlockedByMyeloidExpansion, true);
  assert.equal(d.protectedSuspiciousBlastoid, false);
  assert.equal(d.classification, 'PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION');
});

test('PASS 4 — application preserves myeloid-expansion classification and clears legacy blast flags', () => {
  const input = pathologicExpansionFixture();
  input.findings = { blastSuspicion: true, immatureCells: true, monomorphicPopulation: true };
  const out = applyMarrowPrecursorDiscrimination(input);
  assert.equal(out.findings.blastSuspicion, false);
  assert.equal(out.findings.immatureCells, false);
  assert.equal(out.findings.monomorphicPopulation, false);
  assert.equal(out.findings.myeloidExpansionPattern, true);
  assert.equal(out.morphologicRiskClass, 'MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN');
});

test('PASS 5 — true distinct coherent repeated blastoid population remains protected', () => {
  const p = applyMarrowRecoveredCytologyProjection(trueBlastFixture());
  assert.equal(p.marrowRecoveredCytologyProjection.structuredPositive, true);
  assert.equal(p.marrowPositiveBlastEvidenceLock.active, true);
  assert.equal(p.findings.blastSuspicion, true);

  const d = evaluateMarrowPrecursorDiscrimination(p);
  assert.equal(d.protectedObservedBlastoid, true);
  assert.equal(d.strongBlastoidPattern, true);
  assert.equal(d.classification, 'BLASTOID_PATTERN_SUPPORTED');
});

test('PASS 6 — repeated cytology alone is insufficient when coherence and separation from continuum are explicitly false', () => {
  const e = readRecoveredMarrowBlastEvidence(pathologicExpansionFixture({
    approximateBlastLikeCells: 0,
  }));
  assert.equal(e.repeatedPattern, true);
  assert.equal(e.coherentSubset, false);
  assert.equal(e.distinctFromMaturationContinuum, false);
  assert.equal(e.structuredPositive, false);
});

test('PASS 7 — pathologic expansion can only be overridden defensively by counted, distinct, coherent, repeated blastoid architecture', () => {
  const f = pathologicExpansionFixture({
    approximateBlastLikeCells: 3,
    blastoidSubpopulationContext: {
      distinctFromMaturationContinuum: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      disproportionateImmatureSubset: true,
      matureFormsCoexist: true,
    },
    immatureCellCytology: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: true,
      scantBasophilicCytoplasm: true,
      morphologicallyCoherent: true,
      repeatedSubsetAcrossField: true,
      distinctFromMaturationContinuum: true,
    },
  });
  const e = readRecoveredMarrowBlastEvidence(f);
  assert.equal(e.pathologicExpansionOverrideQualified, true);
  assert.equal(e.structuredPositive, true);
});

test('PASS 8 — 005.40 metadata is exposed by both projection and precursor discrimination', () => {
  const e = readRecoveredMarrowBlastEvidence(pathologicExpansionFixture());
  const d = evaluateMarrowPrecursorDiscrimination(pathologicExpansionFixture());
  assert.equal(e.focalCytologyContextualizationVersion, 'BE-FIX-005.40');
  assert.equal(d.architectureGatedBlastEscalationVersion, 'BE-FIX-005.40');
});

test('PASS 9 — server exposes 005.40 runtime fingerprints and logging', () => {
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  assert.match(server, /MARROW_FOCAL_CYTOLOGY_CONTEXTUALIZATION_VERSION/);
  assert.match(server, /MARROW_ARCHITECTURE_GATED_BLAST_ESCALATION_VERSION/);
  assert.match(server, /marrowFocalCytologyContextualizationVersion/);
  assert.match(server, /marrowArchitectureGatedBlastEscalationVersion/);
  assert.match(server, /BE-FIX-005\.40 — MARROW FOCAL CYTOLOGY CONTEXTUALIZATION \/ ARCHITECTURE-GATED BLAST ESCALATION/);
});
