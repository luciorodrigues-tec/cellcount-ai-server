import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const serverPath = path.resolve('server.js');
const source = fs.readFileSync(serverPath, 'utf8');

test('PASS 0 — 005.21 version is registered', () => {
  assert.match(source, /VME_LENGTH_EXHAUSTION_RECOVERY_VERSION\s*=\s*["']BE-FIX-005\.21["']/);
});

test('PASS 1 — primary VME defaults to minimal reasoning', () => {
  assert.match(source, /OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']minimal["']/);
});

test('PASS 2 — primary structured-output budget is raised above legacy 1800', () => {
  assert.match(source, /OPENAI_VISION_MAX_COMPLETION_TOKENS\s*\|\|\s*3200/);
});

test('PASS 3 — length exhaustion is detected only when acquisition is incomplete', () => {
  assert.match(source, /primaryFinishReason\s*===\s*["']length["'][\s\S]{0,160}visualMorphologyEvidenceAcquisition\.complete\s*!==\s*true/);
});

test('PASS 4 — length exhaustion automatically authorizes one repair pass', () => {
  assert.match(source, /effectiveRepairEnabled\s*=\s*\n?\s*visualRepairEnabled\s*\|\|\s*lengthExhausted/);
  assert.match(source, /repairEnabled:\s*effectiveRepairEnabled/);
});

test('PASS 5 — length recovery has a bounded primary latency budget', () => {
  assert.match(source, /VME_LENGTH_RECOVERY_PRIMARY_BUDGET_MS\s*\|\|\s*65000/);
  assert.match(source, /effectiveRepairBudgetMs/);
});

test('PASS 6 — repair uses minimal reasoning and a larger structured-output budget', () => {
  assert.match(source, /OPENAI_VISION_REPAIR_REASONING_EFFORT\s*\|\|\s*["']minimal["']/);
  assert.match(source, /OPENAI_VISION_REPAIR_MAX_COMPLETION_TOKENS\s*\|\|\s*3600/);
});

test('PASS 7 — fail-closed suppression is preserved after unsuccessful recovery', () => {
  assert.match(source, /visualMorphologyEvidenceAcquisition\.complete\s*!==\s*true/);
  assert.match(source, /buildIncompleteVisualAcquisitionResponse/);
  assert.match(source, /REPORT SUPPRESSED: INCOMPLETE VISUAL ACQUISITION/);
});

test('PASS 8 — runtime fingerprint exposes 005.21 and acquisition defaults', () => {
  assert.match(source, /vmeLengthExhaustionRecoveryVersion:\s*\n?\s*VME_LENGTH_EXHAUSTION_RECOVERY_VERSION/);
  assert.match(source, /repairMaxCompletionTokens/);
  assert.match(source, /lengthRecoveryPrimaryBudgetMs/);
});
