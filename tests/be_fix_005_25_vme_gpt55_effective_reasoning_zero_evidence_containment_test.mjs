import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION,
  assessBoneMarrowVisualEvidenceAcquisition,
  buildBoneMarrowVisualRepairPrompt,
} from '../ai/visualMorphologyEvidenceAcquisitionContract.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const serverText = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

test('PASS 0 — 005.25 version is registered', () => {
  assert.equal(VME_EFFECTIVE_REASONING_ZERO_EVIDENCE_VERSION, 'BE-FIX-005.25');
  assert.match(serverText, /VME_EFFECTIVE_REASONING_ENFORCEMENT_VERSION/);
});

test('PASS 1 — effective reasoning_effort is enforced for marrow and peripheral visual calls', () => {
  assert.match(serverText, /completionRequest\.reasoning_effort\s*=\s*effectiveVisionReasoningEffort/);
  assert.doesNotMatch(serverText, /: "model-default"/);
});

test('PASS 2 — marrow primary token budget is explicit and no longer hidden behind peripheral logging', () => {
  assert.match(serverText, /OPENAI_MARROW_MAX_COMPLETION_TOKENS \|\| 4000/);
  assert.match(serverText, /maxCompletionTokens: effectivePrimaryMaxCompletionTokens/);
  assert.match(serverText, /max_completion_tokens: effectivePrimaryMaxCompletionTokens/);
});

test('PASS 3 — empty marrow payload is zero evidence and must retry/fail closed', () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: { visualEvidence: { cellSizeIncrease: false } },
    analysisSource: 'ai_visual',
  });
  assert.equal(acquisition.complete, false);
  assert.equal(acquisition.zeroEvidence, true);
  assert.equal(acquisition.retryRecommended, true);
});

test('PASS 4 — explicit marrow containers are not treated as zero evidence', () => {
  const acquisition = assessBoneMarrowVisualEvidenceAcquisition({
    visionResponse: {
      specimenAssessment: { status: 'present', summary: 'Material medular.' },
      marrowAdequacy: { status: 'present', summary: 'Campo avaliável.' },
      myeloidSeries: { status: 'present', summary: 'Série mieloide observada.' },
      erythroidSeries: { status: 'present', summary: 'Série eritroide observada.' },
      megakaryocyticSeries: { status: 'notAssessable', summary: 'Não avaliável.' },
      blastAssessment: {
        status: 'present',
        evidenceState: 'SUSPICIOUS_POPULATION',
        approximateBlastLikeCells: 12,
        populationPattern: 'repeated',
        summary: 'População blastoide suspeita.',
      },
    },
    analysisSource: 'ai_visual',
  });
  assert.equal(acquisition.zeroEvidence, false);
  assert.equal(acquisition.complete, true);
  assert.equal(acquisition.acquiredDomains.blastPopulationEvidenceState, 'SUSPICIOUS_POPULATION');
});

test('PASS 5 — marrow length/incomplete acquisition is eligible for repair instead of bypassing repair', () => {
  assert.doesNotMatch(serverText, /analysisType !== "bone_marrow" &&\s*shouldAttemptVisualMorphologyRepair/);
  assert.match(serverText, /buildBoneMarrowVisualRepairPrompt/);
  assert.match(buildBoneMarrowVisualRepairPrompt({ missingRequirements: ['marrow_blastAssessment'] }), /blastAssessment/);
});

test('PASS 6 — incomplete marrow acquisition is suppressed before clinical governors', () => {
  assert.match(serverText, /if \(\s*visualMorphologyEvidenceAcquisition\.complete !== true\s*\) \{/);
  assert.match(serverText, /buildIncompleteVisualAcquisitionResponse/);
});

test('PASS 7 — zero/incomplete acquisition cannot synthesize negative blast morphology', () => {
  assert.match(serverText, /const zeroEvidenceAcquisition/);
  assert.match(serverText, /blastEvidenceState === 'NOT_OBSERVED_IN_EVALUABLE_FIELD'/);
  assert.match(serverText, /if \(zeroEvidenceAcquisition !== true\) \{/);
});

test('PASS 8 — runtime fingerprint exposes 005.25 effective configuration', () => {
  assert.match(serverText, /vmeEffectiveReasoningEnforcementVersion/);
  assert.match(serverText, /boneMarrowReasoningEffort/);
  assert.match(serverText, /boneMarrowMaxCompletionTokens/);
});
