import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

console.log("================================================================");
console.log("BE-FIX-005.10 — FINAL ANALYSIS ASSEMBLY & RESPONSE RECOVERY");
console.log("================================================================");

test("PASS 0 — 005.10 runtime fingerprint is registered", () => {
  assert.match(server, /finalAnalysisAssemblyRecoveryVersion:\s*"BE-FIX-005\.10"/);
});

test("PASS 1 — final response assembly does not reference out-of-scope analysis variable", () => {
  const start = server.indexOf("// FINAL CLINICAL GOVERNOR — única autoridade final");
  const end = server.indexOf("// RAW POSITIVE FINDINGS FINAL RESTORE", start);
  assert.ok(start >= 0 && end > start);
  const executable = server
    .slice(start, end)
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
  assert.doesNotMatch(executable, /\bmergedAnalysis\b/);
});

test("PASS 2 — VME provenance is restored from validated/structured results", () => {
  assert.match(server, /validation\.result\.visualMorphologyEvidenceAcquisition\s*\?\?\s*structured\.visualMorphologyEvidenceAcquisition/);
});

test("PASS 3 — incomplete VME state survives final assembly", () => {
  assert.match(server, /validation\.result\.visualEvidenceAcquisitionIncomplete\s*===\s*true\s*\|\|\s*structured\.visualEvidenceAcquisitionIncomplete\s*===\s*true/);
});

test("PASS 4 — incomplete VME still forces review and blocks normality", () => {
  assert.match(server, /if\s*\(finalResult\.visualEvidenceAcquisitionIncomplete\)/);
  assert.match(server, /finalResult\.requiresHumanReview\s*=\s*true/);
  assert.match(server, /finalResult\.normalityBlocked\s*=\s*true/);
});
