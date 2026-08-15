import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLocalMorphologyEvidence,
  localMorphologyEvidenceContractStatus,
  MARROW_POSITIVE_EVIDENCE_PROJECTION_VERSION,
} from '../ai/localMorphologyEvidenceContract.js';
import {
  applyMarrowBlastPopulationGovernance,
  MARROW_BLAST_POPULATION_GOVERNANCE_VERSION,
  MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION,
} from '../ai/boneMarrow/marrowBlastPopulationSentinel.js';
import applyFinalClinicalGovernor from '../ai/finalClinicalGovernor.js';
import fs from 'node:fs';

const marrowVision = {
  specimenAssessment: {
    status: 'present',
    specimenType: 'BONE_MARROW_ASPIRATE',
    summary: 'Material medular no campo analisado.',
  },
  marrowAdequacy: {
    status: 'present',
    representativity: 'campo limitado para percentual global',
    summary: 'Amostra medular avaliÃ¡vel morfologicamente com representatividade limitada.',
  },
  myeloidSeries: { status: 'present', summary: 'SÃ©rie mieloide parcialmente representada.' },
  erythroidSeries: { status: 'present', summary: 'SÃ©rie eritroide parcialmente representada.' },
  megakaryocyticSeries: { status: 'notAssessable', summary: 'MegacariÃ³citos nÃ£o avaliÃ¡veis neste campo.' },
  blastAssessment: {
    status: 'present',
    observed: null,
    evidenceState: 'SUSPICIOUS_POPULATION',
    approximateBlastLikeCells: 14,
    populationPattern: 'repeated',
    morphologySupport: {
      highNCRatio: true,
      openFineChromatin: true,
      nucleoli: false,
      scantBasophilicCytoplasm: true,
      monomorphism: true,
      repeatedAcrossField: true,
    },
    lineageAssignable: false,
    lineage: 'indeterminate',
    summary: 'PopulaÃ§Ã£o repetida de elementos imaturos/blastoides no campo medular.',
  },
};

test('PASS 0 â€” 005.26 versions are registered without erasing 005.24 identity', () => {
  assert.equal(MARROW_BLAST_POPULATION_GOVERNANCE_VERSION, 'BE-FIX-005.24');
  assert.equal(MARROW_POSITIVE_EVIDENCE_PROJECTION_VERSION, 'BE-FIX-005.26');
  assert.equal(MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION, 'BE-FIX-005.26');
});

test('PASS 1 â€” structured marrow blast population makes canonical LME evidence available', () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: marrowVision });
  assert.equal(lme.evidenceAvailable, true);
  assert.equal(lme.marrow.blastPopulationEvidence.positive, true);
  assert.equal(lme.marrow.blastPopulationEvidence.evidenceState, 'SUSPICIOUS_POPULATION');
  assert.match(lme.leukocytes.description, /populaÃ§Ã£o repetida/i);
  assert.equal(localMorphologyEvidenceContractStatus(lme).valid, true);
});

test('PASS 2 â€” marrow positive evidence projects into critical morphology without peripheral WBC gate', () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: marrowVision });
  assert.equal(lme.criticalMorphology.blastLikeMorphology, 'SUSPICIOUS_INDETERMINATE');
});

test('PASS 3 â€” 005.24/005.26 governance promotes suspicious marrow population despite limited field', () => {
  const input = {
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: marrowVision.blastAssessment,
    rawResponse: marrowVision,
    fieldAdequacy: {
      visibleLeukocytes: 0,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      limitedField: true,
    },
    localMorphologyEvidence: createLocalMorphologyEvidence({ visionResponse: marrowVision }),
    findings: {}, overallAssessment: {}, morphologyAnalysis: {}, structuredReport: {},
  };
  const out = applyMarrowBlastPopulationGovernance(input);
  assert.equal(out.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.equal(out.localMorphologyEvidence.evidenceAvailable, true);
  assert.equal(out.findings.blastSuspicion, true);
  assert.notEqual(out.finalClassification, 'CLASS_1_LIMITED_FIELD');
});

test('PASS 4 â€” generic final governor recognizes the marrow priority lock before limited-field fallback', () => {
  const governed = applyMarrowBlastPopulationGovernance({
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: marrowVision.blastAssessment,
    rawResponse: marrowVision,
    fieldAdequacy: {
      visibleLeukocytes: 0,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      limitedField: true,
    },
    localMorphologyEvidence: createLocalMorphologyEvidence({ visionResponse: marrowVision }),
    findings: {}, overallAssessment: {}, morphologyAnalysis: {}, structuredReport: {}, confidenceAnalysis: {},
  });
  const final = applyFinalClinicalGovernor(governed);
  assert.equal(final.finalClassification, 'MARROW_BLASTOID_POPULATION_SUSPICIOUS');
  assert.match(final.mainFinding, /SUSPEITA DE POPULA.*BLASTOIDE\/IMATURA/i);
});

test('PASS 5 â€” observed marrow population retains observed class and cannot be downgraded by representativity', () => {
  const observedVision = structuredClone(marrowVision);
  observedVision.blastAssessment.evidenceState = 'OBSERVED_POPULATION';
  observedVision.blastAssessment.observed = true;
  const governed = applyMarrowBlastPopulationGovernance({
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: observedVision.blastAssessment,
    rawResponse: observedVision,
    fieldAdequacy: { visibleLeukocytes: 0, adequateForPopulationAssessment: false, limitedField: true },
    localMorphologyEvidence: createLocalMorphologyEvidence({ visionResponse: observedVision }),
    findings: {}, overallAssessment: {}, morphologyAnalysis: {}, structuredReport: {}, confidenceAnalysis: {},
  });
  const final = applyFinalClinicalGovernor(governed);
  assert.equal(final.finalClassification, 'MARROW_BLASTOID_POPULATION_OBSERVED');
});

test('PASS 6 â€” lineage safety remains locked', () => {
  const out = applyMarrowBlastPopulationGovernance({
    specimenType: 'BONE_MARROW_ASPIRATE',
    blastAssessment: marrowVision.blastAssessment,
    rawResponse: marrowVision,
    localMorphologyEvidence: createLocalMorphologyEvidence({ visionResponse: marrowVision }),
    findings: {}, overallAssessment: {}, morphologyAnalysis: {}, structuredReport: {},
  });
  assert.match(out.hematologicReasoning.whatICannotConfirm, /confirma LLA, LMA, linhagem/i);
  assert.doesNotMatch(out.mainFinding, /diagnÃ³stico de LLA|diagnÃ³stico de LMA/i);
});

test('PASS 7 â€” marrow NOT_ASSESSABLE does not become positive evidence', () => {
  const negative = structuredClone(marrowVision);
  negative.blastAssessment.evidenceState = 'NOT_ASSESSABLE';
  negative.blastAssessment.summary = 'Pesquisa de blastos nÃ£o suficientemente avaliÃ¡vel.';
  const lme = createLocalMorphologyEvidence({ visionResponse: negative });
  assert.equal(lme.marrow.blastPopulationEvidence.positive, false);
  assert.notEqual(lme.criticalMorphology.blastLikeMorphology, 'OBSERVED');
});

test('PASS 8 â€” server exposes 005.26 runtime fingerprint and reapplies lock after final generic governor/sentinels', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /marrowPositiveEvidencePriorityLockVersion/);
  assert.match(source, /MARROW_POSITIVE_EVIDENCE_PRIORITY_LOCK_VERSION/);
  const finalGov = source.indexOf('let finalResult =');
  const reactive = source.indexOf('applyReactiveLymphoidEvidenceSentinel', finalGov);
  const finalMarrowLock = source.indexOf('FINAL MARROW POSITIVE-EVIDENCE PRIORITY LOCK', reactive);
  const cra = source.indexOf('CRA-001.1', finalMarrowLock);
  assert.ok(finalGov >= 0 && reactive > finalGov && finalMarrowLock > reactive && cra > finalMarrowLock);
});

test('PASS 9 â€” 005.25 effective reasoning enforcement is preserved', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /OPENAI_VISION_REASONING_EFFORT \|\| "none"/);
  assert.match(source, /OPENAI_MARROW_MAX_COMPLETION_TOKENS \|\| 4000/);
  assert.match(source, /VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION/);
});

