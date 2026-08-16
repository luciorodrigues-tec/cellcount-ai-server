import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildVisualMorphologyAcquisitionResponseFormat,
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  PERIPHERAL_POSITIVE_MORPHOLOGY_ACQUISITION_VERSION,
} from '../ai/visualMorphologyEvidenceAcquisitionContract.js';

import {
  createLocalMorphologyEvidence,
  PERIPHERAL_POSITIVE_MORPHOLOGY_LME_VERSION,
} from '../ai/localMorphologyEvidenceContract.js';

import {
  evaluatePeripheralPositiveMorphologyArbitration,
  applyPeripheralPositiveMorphologyArbitration,
  PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION,
} from '../ai/peripheralBloodPositiveMorphologyArbitrationEngine.js';

import {
  evaluateFieldAdequacy,
  PERIPHERAL_SENTINEL_ARBITRATION_FIELD_VERSION,
} from '../ai/fieldAdequacyEngine.js';

import { evaluateParasiteArtifactEvidence } from '../ai/parasiteEvidenceSentinel.js';
import { buildCanonicalClinicalTruth } from '../ai/clinicalResultV2/canonicalClinicalTruthBuilder.js';

function baseVision() {
  return {
    observedMorphology: {
      globalField: 'Campo periférico limitado com hemácias e uma célula nucleada focal.',
      technicalQuality: 'Moderada.',
      representativity: 'Campo limitado.',
      erythrocytes: {
        description: 'Hemácias com discreta população azulada/acinzentada.',
        size: 'predominantemente normocíticas',
        chromia: 'policromasia focal',
        polychromasiaState: 'OBSERVED',
        polychromasiaEvidence: 'Hemácias azuladas/acinzentadas compatíveis com policromasia.',
        anisocytosis: 'discreta',
        poikilocytosis: 'não evidente',
        specificForms: [],
        artifactConsiderations: 'Iluminação não explica integralmente a tonalidade azulada.',
      },
      leukocytes: {
        description: 'Uma célula nucleada mononuclear maior que as hemácias adjacentes.',
        approximateVisibleCells: 1,
        countStatus: 'OBSERVED_COUNT',
        heterogeneity: 'indeterminada por baixa cardinalidade',
        nuclearMorphology: 'núcleo arredondado com alta relação N:C',
        chromatin: 'intermediária a discretamente frouxa',
        nucleoli: 'não plenamente avaliáveis',
        cytoplasm: 'escasso a moderado, basofílico',
        maturation: 'imaturo suspeito',
        atypia: 'célula focal atípica',
        blastLikeFeatures: 'alguns traços imaturos, insuficientes para população blástica',
        hematopoieticCellCandidate: true,
        focalImmatureCellState: 'SUSPICIOUS_INDETERMINATE',
        focalImmatureCellEvidence: 'Célula hematopoiética focal com traços imaturos.',
      },
      platelets: {
        description: 'Pequenos elementos plaquetários dispersos.',
        distribution: 'dispersos',
        size: 'habitual',
        aggregates: 'não evidentes',
      },
      parasites: {
        evidenceState: 'OBSERVED',
        approximateVisibleForms: 1,
        phenotype: 'INDETERMINATE',
        morphology: 'estrutura púrpura isolada',
        extracellular: false,
        elongatedOrCurved: false,
        undulatingMembraneLike: false,
        flagellumLike: false,
        kinetoplastLike: false,
        intracellularForms: false,
        artifactDifferential: 'célula nucleada/artefato',
        confidence: 'low',
      },
      artifacts: [],
      positiveEvidence: ['Policromasia presente', 'Célula nucleada focal'],
      uncertainty: ['Natureza exata da célula imatura requer revisão'],
    },
    fieldAdequacy: {
      visibleLeukocytes: 1,
      adequateForLeukocyteAnalysis: true,
      adequateForBlastScreening: true,
      adequateForPopulationAssessment: false,
      limitedField: true,
      limitationReason: 'Campo limitado',
    },
    imageQuality: { classification: 'Moderada', description: 'Moderada', limitations: [] },
    findings: {
      reactiveLymphocytes: false,
      largeMononuclearCells: true,
      plasmacytoidCells: false,
      plasmocytes: false,
      plasmablasts: false,
      atypicalLymphocytes: false,
      monomorphicPopulation: false,
      immatureCells: true,
      blastSuspicion: true,
      blastEvidenceState: 'SUSPICIOUS_INDETERMINATE',
      observedBlastLikeCount: 0,
    },
    visualEvidence: {
      cellSizeIncrease: true,
      abundantBasophilicCytoplasm: false,
      erythrocyteMolding: false,
      irregularCellBorders: false,
      eccentricNucleus: false,
      prominentNucleolus: false,
    },
    positiveFindings: ['Policromasia presente no campo'],
    negativeFindingsStructured: [],
    heatmapRegions: [],
  };
}

test('PASS 0 — 005.50.4 identities and acquisition fields are registered', () => {
  assert.equal(PERIPHERAL_POSITIVE_MORPHOLOGY_ACQUISITION_VERSION, 'BE-FIX-005.50.4');
  assert.equal(PERIPHERAL_POSITIVE_MORPHOLOGY_LME_VERSION, 'BE-FIX-005.50.4');
  assert.equal(PERIPHERAL_BLOOD_POSITIVE_MORPHOLOGY_ARBITRATION_VERSION, 'BE-FIX-005.50.4');
  assert.equal(PERIPHERAL_SENTINEL_ARBITRATION_FIELD_VERSION, 'BE-FIX-005.50.4');

  const schema = buildVisualMorphologyAcquisitionResponseFormat().json_schema.schema;
  assert.ok(schema.properties.observedMorphology.properties.erythrocytes.properties.polychromasiaState);
  assert.ok(schema.properties.observedMorphology.properties.leukocytes.properties.focalImmatureCellState);
  assert.match(buildPrimaryVisualMorphologyAcquisitionPrompt(), /POLICROMASIA/i);
});

test('PASS 1 — LME preserves explicit polychromasia and focal hematopoietic evidence', () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: baseVision(), analysisSource: 'ai_visual' });
  assert.equal(lme.erythrocytes.polychromasiaState, 'OBSERVED');
  assert.match(lme.erythrocytes.polychromasiaEvidence, /azuladas/i);
  assert.equal(lme.leukocytes.hematopoieticCellCandidate, true);
  assert.equal(lme.leukocytes.focalImmatureCellState, 'SUSPICIOUS_INDETERMINATE');
});

test('PASS 2 — weak single competing parasite observation is downgraded, not promoted', () => {
  const raw = baseVision();
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const analysis = { ...raw, rawResponse: raw, localMorphologyEvidence: lme, findings: { ...raw.findings, parasiteSuspected: true } };
  const d = evaluatePeripheralPositiveMorphologyArbitration(analysis);
  assert.equal(d.parasiteArbitration.competingWeakParasite, true);
  assert.equal(d.parasiteArbitration.effectiveEvidenceState, 'SUSPICIOUS_INDETERMINATE');
  assert.equal(d.parasiteArbitration.parasitePromotionAllowed, false);
});

test('PASS 3 — arbitration preserves polychromasia and focal immaturity without population claim', () => {
  const raw = baseVision();
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const result = applyPeripheralPositiveMorphologyArbitration({
    ...raw,
    rawResponse: raw,
    localMorphologyEvidence: lme,
    morphologyAnalysis: { erythrocyteReview: raw.observedMorphology.erythrocytes.description },
    findings: { ...raw.findings, parasiteSuspected: true },
    overallAssessment: { riskCategory: 'CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE' },
    morphologicRiskClass: 'CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE',
    finalClassification: 'CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE',
  });
  assert.equal(result.erythrocyteFindings.polychromasia, true);
  assert.equal(result.findings.focalHematopoieticCellObserved, true);
  assert.equal(result.findings.focalImmatureCellState, 'SUSPICIOUS_INDETERMINATE');
  assert.equal(result.findings.parasiteSuspected, false);
  assert.equal(result.peripheralMorphologyClassification, 'FOCAL_IMMATURE_OR_BLASTOID_CELL');
  assert.equal(result.adequacyMorphologyAxis.adequacyClassification, 'CLASS_1_LIMITED_FIELD');
});

test('PASS 4 — field adequacy no longer fabricates parasite signal from generic unusual-structure text', () => {
  const raw = baseVision();
  raw.observedMorphology.parasites.evidenceState = 'NOT_ASSESSABLE';
  raw.observedMorphology.globalField += ' Estrutura incomum no campo.';
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const adequacy = evaluateFieldAdequacy({ ...raw, rawResponse: raw, localMorphologyEvidence: lme });
  assert.equal(adequacy.unusualStructureSignal, true);
  assert.equal(adequacy.parasiteSignal, false);
});

test('PASS 5 — true structured extracellular parasite remains protected', () => {
  const raw = baseVision();
  Object.assign(raw.observedMorphology.parasites, {
    evidenceState: 'OBSERVED', approximateVisibleForms: 3,
    phenotype: 'TRYPANOSOMATID_LIKE', extracellular: true,
    elongatedOrCurved: true, undulatingMembraneLike: true, flagellumLike: true,
    kinetoplastLike: false, intracellularForms: false, confidence: 'high',
  });
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const analysis = { ...raw, rawResponse: raw, localMorphologyEvidence: lme };
  const d = evaluatePeripheralPositiveMorphologyArbitration(analysis);
  assert.equal(d.parasiteArbitration.independentParasiteArchitecture, true);
  assert.equal(d.parasiteArbitration.competingWeakParasite, false);
  assert.equal(d.parasiteArbitration.parasitePromotionAllowed, true);
  assert.equal(evaluateParasiteArtifactEvidence(analysis).explicitPositiveParasiteEvidence, true);
});

test('PASS 6 — canonical truth consumes structured polychromasia after arbitration', () => {
  const raw = baseVision();
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const result = applyPeripheralPositiveMorphologyArbitration({
    ...raw, rawResponse: raw, localMorphologyEvidence: lme,
    morphologyAnalysis: { erythrocyteReview: 'Hemácias avaliáveis.' },
    findings: { ...raw.findings }, confidenceAnalysis: { globalConfidenceScore: 50 },
  });
  const truth = buildCanonicalClinicalTruth(result, { specimenType: 'PERIPHERAL_BLOOD', analysisSource: 'ai_visual' });
  assert.equal(truth.lineages.erythrocytes.positiveMorphology.polychromasia, true);
  assert.equal(truth.lineages.erythrocytes.assessment.state, 'OBSERVED');
});

test('PASS 7 — context alone cannot fabricate immature cell or polychromasia', () => {
  const raw = baseVision();
  raw.observedMorphology.erythrocytes.polychromasiaState = 'NOT_OBSERVED_IN_EVALUABLE_FIELD';
  raw.observedMorphology.erythrocytes.polychromasiaEvidence = '';
  raw.observedMorphology.erythrocytes.chromia = 'normocromia aparente';
  raw.observedMorphology.erythrocytes.description = 'Hemácias sem alteração cromática convincente.';
  raw.positiveFindings = [];
  raw.observedMorphology.positiveEvidence = [];
  raw.observedMorphology.leukocytes.focalImmatureCellState = 'NOT_OBSERVED_IN_EVALUABLE_FIELD';
  raw.observedMorphology.leukocytes.focalImmatureCellEvidence = '';
  raw.observedMorphology.leukocytes.maturation = 'madura';
  raw.observedMorphology.leukocytes.atypia = '';
  raw.observedMorphology.leukocytes.blastLikeFeatures = 'sem critérios blastoides';
  raw.findings.immatureCells = false;
  raw.findings.blastSuspicion = false;
  raw.findings.blastEvidenceState = 'NOT_OBSERVED_IN_EVALUABLE_FIELD';
  const lme = createLocalMorphologyEvidence({ visionResponse: raw, analysisSource: 'ai_visual' });
  const d = evaluatePeripheralPositiveMorphologyArbitration({ ...raw, rawResponse: raw, localMorphologyEvidence: lme, clinicalContext: 'LMA conhecida' });
  assert.equal(d.polychromasia.observed, false);
  assert.equal(d.focalHematopoieticCell.immatureObserved, false);
  assert.equal(d.focalHematopoieticCell.immatureSuspicious, false);
});

test('PASS 8 — server wires 005.50.4 before/after parasite sentinel and exposes runtime fingerprints', async () => {
  const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(server, /peripheralBloodPositiveMorphologyArbitrationVersion/);
  assert.match(server, /peripheralPolychromasiaPreservationVersion/);
  assert.match(server, /peripheralHematopoieticParasiteArbitrationVersion/);
  assert.match(server, /peripheralLimitedFieldNonSuppressionVersion/);
  const pre = server.indexOf('PRE-SENTINEL ARBITRATION');
  const parasite = server.indexOf('applyParasiteEvidenceSentinel', pre);
  const post = server.indexOf('COMPETING HEMATOPOIETIC / PARASITE SENTINEL ARBITRATION');
  assert.ok(pre >= 0 && parasite > pre && post > parasite);
});
