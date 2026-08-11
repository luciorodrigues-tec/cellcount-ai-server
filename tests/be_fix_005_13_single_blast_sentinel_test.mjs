import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applySingleBlastSentinel,
  SINGLE_BLAST_SENTINEL_VERSION,
} from "../ai/singleBlastSentinel.js";
import { applyFieldScopedNegativeFindings } from "../ai/fieldScopedNegativeFindings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

console.log("\n================================================================");
console.log("BE-FIX-005.13 — SINGLE BLAST SENTINEL: TESTS REGISTERED");
console.log("================================================================");

function base() {
  return {
    findings: { reactiveLymphocytes: true, blastSuspicion: false },
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      populationInferenceAllowed: false,
      globalNegativeExclusionAllowed: false,
    },
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: true,
      criticalMorphology: {
        blastLikeMorphology: "NOT_ASSESSABLE",
      },
      leukocytes: {},
    },
  };
}

test("PASS 0 — 005.13 version is registered", () => {
  assert.equal(SINGLE_BLAST_SENTINEL_VERSION, "BE-FIX-005.13");
});

test("PASS 1 — one manual blast triggers critical alert", () => {
  const result = applySingleBlastSentinel({ ...base(), counts: { Blasto: 1 } });
  assert.equal(result.singleBlastSentinel.active, true);
  assert.equal(result.singleBlastSentinel.observedCount, 1);
  assert.equal(result.finalClassification, "CLASS_4_BLAST_SUSPICION");
  assert.equal(result.findings.blastSuspicion, true);
  assert.equal(result.requiresHumanReview, true);
  assert.match(result.mainFinding, /1 blasto/i);
});

test("PASS 2 — one LME observed blast-like signal triggers even in limited field", () => {
  const result = base();
  result.localMorphologyEvidence.criticalMorphology.blastLikeMorphology = "OBSERVED";
  applySingleBlastSentinel(result);
  assert.equal(result.singleBlastSentinel.active, true);
  assert.equal(result.finalClassification, "CLASS_4_BLAST_SUSPICION");
  assert.match(result.riskLevel, /ALERTA CRÍTICO/i);
});

test("PASS 3 — reactive pattern cannot suppress a positive blast signal", () => {
  const result = base();
  result.findings.reactiveLymphocytes = true;
  result.findings.blastSuspicion = true;
  applySingleBlastSentinel(result);
  assert.equal(result.finalClassification, "CLASS_4_BLAST_SUSPICION");
  assert.equal(result.findings.blastSuspicion, true);
});

test("PASS 4 — zero/no positive blast signal does not create an alert", () => {
  const result = applySingleBlastSentinel({ ...base(), counts: { Blasto: 0 } });
  assert.equal(result.singleBlastSentinel.active, false);
  assert.notEqual(result.finalClassification, "CLASS_4_BLAST_SUSPICION");
});

test("PASS 5 — blast alert removes blast from canonical negative list", () => {
  const result = base();
  result.localMorphologyEvidence.criticalMorphology.blastLikeMorphology = "OBSERVED";
  applySingleBlastSentinel(result);
  applyFieldScopedNegativeFindings(result);
  assert.equal(
    result.negativeFindingScope.items.find((x) => x.key === "blasts").status,
    "OBSERVED_OR_SUSPECTED",
  );
  assert.equal(
    result.negativeFindingsStructured.some((x) => /Blastos inequívocos não identificados/i.test(x)),
    false,
  );
});

test("PASS 6 — server applies sentinel after final morphology synthesis and re-locks negatives", () => {
  const source = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const synthesis = source.lastIndexOf("applyEvidenceConsistentFinalMorphologySynthesis(");
  const sentinel = source.lastIndexOf("applySingleBlastSentinel(");
  const negativeRelock = source.indexOf("applyFieldScopedNegativeFindings(", sentinel);
  assert.ok(synthesis >= 0);
  assert.ok(sentinel > synthesis);
  assert.ok(negativeRelock > sentinel);
  assert.match(source, /singleBlastSentinelVersion:\s*\n\s*SINGLE_BLAST_SENTINEL_VERSION/);
});
