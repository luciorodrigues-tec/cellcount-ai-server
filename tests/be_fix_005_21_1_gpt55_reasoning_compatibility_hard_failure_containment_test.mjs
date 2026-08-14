import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

test("PASS 0 — 005.21.1 reasoning compatibility version is registered", () => {
  assert.match(
    server,
    /VME_REASONING_COMPATIBILITY_VERSION\s*=\s*["']BE-FIX-005\.21\.1["']/,
  );
});

test("PASS 1 — primary VME defaults to reasoning_effort none", () => {
  assert.match(
    server,
    /OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
  assert.doesNotMatch(
    server,
    /OPENAI_VISION_REASONING_EFFORT\s*\|\|\s*["']minimal["']/,
  );
});

test("PASS 2 — repair VME also defaults to reasoning_effort none", () => {
  assert.match(
    server,
    /OPENAI_VISION_REPAIR_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
  assert.doesNotMatch(
    server,
    /OPENAI_VISION_REPAIR_REASONING_EFFORT\s*\|\|\s*["']minimal["']/,
  );
});

test("PASS 3 — 005.21 structured-output budgets remain 3200/3600", () => {
  assert.match(server, /OPENAI_VISION_MAX_COMPLETION_TOKENS\s*\|\|\s*3200/);
  assert.match(server, /OPENAI_VISION_REPAIR_MAX_COMPLETION_TOKENS\s*\|\|\s*3600/);
});

test("PASS 4 — technical acquisition failure is explicit and fail-closed", () => {
  assert.match(server, /VISUAL_ACQUISITION_TECHNICAL_FAILURE/);
  assert.match(server, /safeFailureMode:\s*true/);
  assert.match(server, /reportSuppressed:\s*true/);
  assert.match(server, /failedClosed:\s*true/);
  assert.match(server, /visualAcquisitionOnly:\s*true/);
});

test("PASS 5 — technical failure is returned before validateAIResult", () => {
  const routeStart = server.indexOf('app.post(\n\n  "/analyze-slide"');
  assert.ok(routeStart >= 0);
  const route = server.slice(routeStart);
  const gate = route.indexOf('structured?.errorCode === "VISUAL_ACQUISITION_TECHNICAL_FAILURE"');
  const validation = route.indexOf("validateAIResult(", gate);
  assert.ok(gate >= 0);
  assert.ok(validation > gate);
  assert.match(route.slice(gate, validation), /return res\.status\(422\)\.json\(structured\)/);
});

test("PASS 6 — runtime fingerprint exposes 005.21.1 and none defaults", () => {
  assert.match(
    server,
    /vmeReasoningCompatibilityVersion:\s*\n?\s*VME_REASONING_COMPATIBILITY_VERSION/,
  );
  assert.match(
    server,
    /repairReasoningEffort:\s*\n?\s*process\.env\.OPENAI_VISION_REPAIR_REASONING_EFFORT\s*\|\|\s*["']none["']/,
  );
});

test("PASS 7 — 005.21 length-exhaustion recovery remains intact", () => {
  assert.match(
    server,
    /VME_LENGTH_EXHAUSTION_RECOVERY_VERSION\s*=\s*["']BE-FIX-005\.21["']/,
  );
  assert.match(server, /lengthExhausted/);
  assert.match(server, /effectiveRepairEnabled/);
});
