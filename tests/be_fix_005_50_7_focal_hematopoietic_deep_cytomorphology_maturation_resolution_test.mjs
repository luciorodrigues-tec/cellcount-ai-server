import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  buildVisualMorphologyAcquisitionResponseFormat,
} from '../ai/visualMorphologyEvidenceAcquisitionContract.js';
import {
  createLocalMorphologyEvidence,
  PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_LME_VERSION,
} from '../ai/localMorphologyEvidenceContract.js';
import {
  evaluatePeripheralFocalHematopoieticCytomorphology,
  applyPeripheralFocalHematopoieticCytomorphologyResolution,
  PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION,
  PERIPHERAL_MATURATION_STATE_RESOLUTION_VERSION,
  PERIPHERAL_CELL_FEATURE_PROVENANCE_VERSION,
} from '../ai/peripheralFocalHematopoieticCytomorphologyEngine.js';
import {
  applyPeripheralBlastoidCytologyAuthority,
  PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION,
} from '../ai/peripheralBlastoidCytologyAuthorityEngine.js';

const U = 'NOT_ASSESSABLE';
const O = 'OBSERVED';
const N = 'NOT_OBSERVED_IN_EVALUABLE_CELL';

function deep(overrides = {}) {
  return {
    state: 'OBSERVED',
    cellCount: 1,
    relativeSizeDescription: 'Célula maior que as hemácias adjacentes.',
    nuclearDescription: 'Núcleo arredondado/oval, sem segmentação claramente resolvida.',
    chromatinDescription: 'Cromatina parcialmente avaliável.',
    nucleoliDescription: 'Nucléolos parcialmente avaliáveis.',
    cytoplasmDescription: 'Citoplasma estreito a moderado.',
    granulationDescription: 'Granulação não caracterizada com segurança.',
    inclusionDescription: 'Inclusões não caracterizadas com segurança.',
    largeCellSize: O,
    highNCRatio: O,
    openFineChromatin: O,
    visibleNucleoli: O,
    irregularNuclearContour: N,
    segmentedOrLobulatedNucleus: N,
    condensedChromatin: N,
    scantCytoplasm: O,
    basophilicCytoplasm: U,
    cytoplasmicGranules: U,
    cytoplasmicInclusions: U,
    modelMaturationImpression: 'IMMATURE_OR_BLASTOID_LIKE',
    evidenceSummary: 'Relação N:C aumentada, cromatina aberta e nucléolo visível.',
    ...overrides,
  };
}

function rawWithDeep(deepValue = deep()) {
  return {
    observedMorphology: {
      globalField: 'Campo periférico limitado.',
      technicalQuality: 'Qualidade moderada.',
      representativity: 'Campo focal.',
      erythrocytes: {
        description: 'Hemácias avaliáveis.',
        size: 'normocíticas',
        chromia: 'normocrômicas',
        polychromasiaState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
        polychromasiaEvidence: '',
        anisocytosis: 'não proeminente',
        poikilocytosis: 'não proeminente',
        specificForms: [],
        artifactConsiderations: '',
      },
      leukocytes: {
        description: 'Uma célula hematopoiética focal.',
        approximateVisibleCells: 1,
        countStatus: 'OBSERVED_COUNT',
        heterogeneity: 'indeterminada',
        nuclearMorphology: 'núcleo arredondado/oval',
        chromatin: 'parcialmente avaliável',
        nucleoli: 'parcialmente avaliáveis',
        cytoplasm: 'estreito a moderado',
        maturation: 'indeterminada',
        atypia: 'não classificada',
        blastLikeFeatures: '',
        hematopoieticCellCandidate: true,
        focalImmatureCellState: 'NOT_ASSESSABLE',
        focalImmatureCellEvidence: 'Célula focal requer caracterização.',
        focalCellCytomorphology: deepValue,
        focalBlastoidCytology: {
          state: 'NOT_ASSESSABLE',
          cellCount: 1,
          highNCRatio: 'NOT_ASSESSABLE',
          openFineChromatin: 'NOT_ASSESSABLE',
          nucleoli: 'NOT_ASSESSABLE',
          scantBasophilicCytoplasm: 'NOT_ASSESSABLE',
          largeCellSize: 'NOT_ASSESSABLE',
          featureCount: 0,
          evidence: '',
          reactiveMimicFeatures: '',
        },
      },
      platelets: {
        description: 'Plaquetas esparsas.',
        distribution: 'dispersas',
        size: 'habitual',
        aggregates: 'não avaliáveis globalmente',
      },
      parasites: {
        evidenceState: 'NOT_OBSERVED_IN_EVALUABLE_FIELD',
        approximateVisibleForms: 0,
        phenotype: 'NONE',
        morphology: '',
        extracellular: false,
        elongatedOrCurved: false,
        undulatingMembraneLike: false,
        flagellumLike: false,
        kinetoplastLike: false,
        intracellularForms: false,
        artifactDifferential: '',
        confidence: 'low',
      },
      artifacts: [],
      positiveEvidence: [],
      uncertainty: [],
    },
    fieldAdequacy: {
      visibleLeukocytes: 1,
      adequateForLeukocyteAnalysis: true,
      adequateForBlastScreening: false,
      adequateForPopulationAssessment: false,
      limitedField: true,
      limitationReason: 'Uma célula focal.',
    },
    findings: {
      blastSuspicion: false,
      immatureCells: false,
      blastEvidenceState: 'NOT_ASSESSABLE',
    },
    imageQuality: { summary: 'moderada' },
    visualEvidence: {},
    heatmapRegions: [],
  };
}

function resultFromRaw(raw = rawWithDeep()) {
  return {
    rawResponse: raw,
    localMorphologyEvidence: createLocalMorphologyEvidence({
      visionResponse: raw,
      analysisSource: 'ai_visual',
    }),
    findings: { ...raw.findings },
    fieldAdequacy: { ...raw.fieldAdequacy },
    morphologyAnalysis: { cellMorphology: {}, leukocyteReview: raw.observedMorphology.leukocytes.description },
    blockNormalReason: [],
  };
}

test('PASS 0 — 005.50.7 identities and deep VME schema are registered', () => {
  assert.equal(PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_VERSION, 'BE-FIX-005.50.7');
  assert.equal(PERIPHERAL_MATURATION_STATE_RESOLUTION_VERSION, 'BE-FIX-005.50.7');
  assert.equal(PERIPHERAL_CELL_FEATURE_PROVENANCE_VERSION, 'BE-FIX-005.50.7');
  assert.equal(PERIPHERAL_FOCAL_CELL_CYTOMORPHOLOGY_LME_VERSION, 'BE-FIX-005.50.7');
  assert.match(buildPrimaryVisualMorphologyAcquisitionPrompt(), /focalCellCytomorphology/);
  const schema = JSON.stringify(buildVisualMorphologyAcquisitionResponseFormat());
  assert.match(schema, /NOT_OBSERVED_IN_EVALUABLE_CELL/);
  assert.match(schema, /condensedChromatin/);
  assert.match(schema, /segmentedOrLobulatedNucleus/);
});

test('PASS 1 — LME preserves deep focal-cell cytomorphology without flattening provenance', () => {
  const raw = rawWithDeep();
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  assert.equal(lme.leukocytes.focalCellCytomorphology.highNCRatio, O);
  assert.equal(lme.leukocytes.focalCellCytomorphology.openFineChromatin, O);
  assert.equal(lme.leukocytes.focalCellCytomorphologyVersion, 'BE-FIX-005.50.7');
});

test('PASS 2 — nuclear immaturity plus independent support resolves focal cell as immature/blastoid-suspected', () => {
  const d = evaluatePeripheralFocalHematopoieticCytomorphology(resultFromRaw());
  assert.equal(d.immatureOrBlastoidSupported, true);
  assert.equal(d.maturationState, 'IMMATURE_OR_BLASTOID_SUSPECTED');
  assert.ok(d.immatureFeatureCount >= 2);
  assert.equal(d.populationInferenceAllowed, false);
});

test('PASS 3 — high N:C plus scant cytoplasm alone never becomes blastoid suspicion', () => {
  const raw = rawWithDeep(deep({
    openFineChromatin: N,
    visibleNucleoli: N,
    condensedChromatin: O,
    highNCRatio: O,
    scantCytoplasm: O,
    largeCellSize: N,
    modelMaturationImpression: 'MATURE_LIKE',
  }));
  const d = evaluatePeripheralFocalHematopoieticCytomorphology(resultFromRaw(raw));
  assert.equal(d.immatureOrBlastoidSupported, false);
  assert.notEqual(d.maturationState, 'IMMATURE_OR_BLASTOID_SUSPECTED');
});

test('PASS 4 — mature state requires positive mature cytomorphology, not merely absence of one blast feature', () => {
  const raw = rawWithDeep(deep({
    largeCellSize: N,
    highNCRatio: N,
    openFineChromatin: N,
    visibleNucleoli: N,
    condensedChromatin: O,
    segmentedOrLobulatedNucleus: O,
    scantCytoplasm: N,
    basophilicCytoplasm: N,
    modelMaturationImpression: 'MATURE_LIKE',
  }));
  const d = evaluatePeripheralFocalHematopoieticCytomorphology(resultFromRaw(raw));
  assert.equal(d.matureSupported, true);
  assert.equal(d.maturationState, 'MATURE_SUPPORTED');
});

test('PASS 5 — unresolved nuclear detail remains INDETERMINATE and cannot become a hard blast negative', () => {
  const raw = rawWithDeep(deep({
    openFineChromatin: U,
    visibleNucleoli: U,
    condensedChromatin: U,
    modelMaturationImpression: 'MATURE_LIKE',
    evidenceSummary: 'Núcleo visível, mas cromatina e nucléolos insuficientemente resolvidos.',
  }));
  let result = resultFromRaw(raw);
  result.findings.blastEvidenceState = 'NOT_OBSERVED_IN_EVALUABLE_FIELD';
  result = applyPeripheralFocalHematopoieticCytomorphologyResolution(result);
  assert.equal(result.peripheralFocalHematopoieticCytomorphology.maturationState, 'INDETERMINATE');
  assert.equal(result.findings.blastEvidenceState, 'NOT_ASSESSABLE');
  assert.equal(result.findings.blastSuspicion, false);
});

test('PASS 6 — deep resolution populates morphologyAnalysis.cellMorphology and per-feature provenance', () => {
  const result = applyPeripheralFocalHematopoieticCytomorphologyResolution(resultFromRaw());
  const cell = result.morphologyAnalysis.cellMorphology.focalHematopoieticCell;
  assert.equal(cell.version, 'BE-FIX-005.50.7');
  assert.equal(cell.maturationState, 'IMMATURE_OR_BLASTOID_SUSPECTED');
  assert.equal(cell.provenance.openFineChromatin.source, 'focal_hematopoietic_cell_1');
  assert.equal(cell.populationInferenceAllowed, false);
});

test('PASS 7 — deep immature resolution projects conservatively into 005.50.6 authority without population or diagnosis', () => {
  let result = applyPeripheralFocalHematopoieticCytomorphologyResolution(resultFromRaw());
  result = applyPeripheralBlastoidCytologyAuthority(result);
  assert.equal(PERIPHERAL_BLASTOID_CYTOLOGY_AUTHORITY_VERSION, 'BE-FIX-005.50.6');
  assert.equal(result.findings.blastSuspicion, true);
  assert.equal(result.findings.blastEvidenceState, 'SUSPICIOUS_INDETERMINATE');
  assert.equal(result.peripheralBlastoidCytologyAuthority.populationInferenceAllowed, false);
  assert.equal(result.peripheralBlastoidCytologyAuthority.amlDiagnosisAllowed, false);
});

test('PASS 8 — clinical context alone cannot fabricate deep cytomorphology or immature state', () => {
  const raw = rawWithDeep(deep({
    state: 'NOT_ASSESSABLE',
    largeCellSize: U,
    highNCRatio: U,
    openFineChromatin: U,
    visibleNucleoli: U,
    irregularNuclearContour: U,
    segmentedOrLobulatedNucleus: U,
    condensedChromatin: U,
    scantCytoplasm: U,
    basophilicCytoplasm: U,
    cytoplasmicGranules: U,
    cytoplasmicInclusions: U,
    modelMaturationImpression: 'INDETERMINATE',
    evidenceSummary: '',
  }));
  raw.clinicalContext = 'Paciente com LMA.';
  const d = evaluatePeripheralFocalHematopoieticCytomorphology(resultFromRaw(raw));
  assert.equal(d.deepObserved, false);
  assert.equal(d.immatureOrBlastoidSupported, false);
  assert.equal(d.maturationState, 'INDETERMINATE');
  assert.equal(d.diagnosisAllowed, false);
});

test('PASS 9 — server runs 005.50.7 before 005.50.6 blast authority and exposes runtime fingerprints', async () => {
  const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(server, /peripheralFocalCellCytomorphologyVersion/);
  assert.match(server, /peripheralMaturationStateResolutionVersion/);
  assert.match(server, /peripheralCellFeatureProvenanceVersion/);
  const deepPre = server.indexOf('BE-FIX-005.50.7 — FOCAL HEMATOPOIETIC DEEP CYTOMORPHOLOGY / PRE-SENTINEL');
  const blastPre = server.indexOf('BE-FIX-005.50.5 — PERIPHERAL BLASTOID CYTOLOGY AUTHORITY / PRE-SENTINEL');
  const terminal = server.indexOf('BE-FIX-005.50.7 — FOCAL CELL MATURATION RESOLUTION / TERMINAL PROJECTION');
  assert.ok(deepPre >= 0 && blastPre > deepPre);
  assert.ok(terminal > blastPre);
});
