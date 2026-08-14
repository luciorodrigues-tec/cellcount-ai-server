import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

test("PASS 0 — 005.21 version is registered", () => {
  assert.match(
    server,
    /VME_LENGTH_EXHAUSTION_RECOVERY_VERSION\s*=\s*["']BE-FIX-005\.21["']/,
  );
});

test("PASS 1 — primary VME uses the GPT-5.5-compatible lowest reasoning default", () => {
  assert.match(
    server,
    /OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
  assert.doesNotMatch(
    server,
    /OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']minimal["']/,
  );
});

test("PASS 2 — primary structured-output budget is raised above legacy 1800", () => {
  assert.match(
    server,
    /OPENAI_VISION_MAX_COMPLETION_TOKENS\s*\|\|\s*3200/,
  );
});

test("PASS 3 — length exhaustion is detected only when acquisition is incomplete", () => {
  assert.match(server, /primaryFinishReason\s*===\s*["']length["']/);
  assert.match(
    server,
    /visualMorphologyEvidenceAcquisition\.complete\s*!==\s*true/,
  );
});

test("PASS 4 — length exhaustion automatically authorizes one repair pass", () => {
  assert.match(
    server,
    /effectiveRepairEnabled\s*=\s*\n?\s*visualRepairEnabled\s*\|\|\s*lengthExhausted/,
  );
});

test("PASS 5 — length recovery has a bounded primary latency budget", () => {
  assert.match(
    server,
    /VME_LENGTH_RECOVERY_PRIMARY_BUDGET_MS\s*\|\|\s*65000/,
  );
});

test("PASS 6 — repair uses GPT-5.5-compatible reasoning and a larger structured-output budget", () => {
  assert.match(
    server,
    /OPENAI_VISION_REPAIR_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
  assert.match(
    server,
    /OPENAI_VISION_REPAIR_MAX_COMPLETION_TOKENS\s*\|\|\s*3600/,
  );
});

test("PASS 7 — fail-closed suppression is preserved after unsuccessful recovery", () => {
  assert.match(server, /REPORT SUPPRESSED: INCOMPLETE VISUAL ACQUISITION/);
  assert.match(server, /failedClosed:\s*true/);
});

test("PASS 8 — runtime fingerprint exposes 005.21 and acquisition defaults", () => {
  assert.match(
    server,
    /vmeLengthExhaustionRecoveryVersion:\s*\n?\s*VME_LENGTH_EXHAUSTION_RECOVERY_VERSION/,
  );
  assert.match(
    server,
    /reasoningEffort:\s*\n?\s*process\.env\.OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
  assert.match(
    server,
    /maxCompletionTokens:\s*\n?\s*Number\(process\.env\.OPENAI_VISION_MAX_COMPLETION_TOKENS\s*\|\|\s*3200\)/,
  );
});
