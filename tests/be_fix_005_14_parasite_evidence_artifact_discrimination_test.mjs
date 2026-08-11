import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PARASITE_EVIDENCE_SENTINEL_VERSION,
  applyParasiteEvidenceSentinel,
  evaluateParasiteArtifactEvidence,
} from "../ai/parasiteEvidenceSentinel.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

function baseResult(parasites = "NOT_ASSESSABLE") {
  return {
    localMorphologyEvidence: {
      contractVersion: "LME-1.0",
      evidenceAvailable: true,
      criticalMorphology: { parasites },
      field: { artifacts: [] },
      erythrocytes: { artifactConsiderations: "" },
    },
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
      parasiteSignal: false,
    },
    findings: {},
    morphologyAnalysis: {},
    whatAISees: {},
    structuredReport: {},
    overallAssessment: {},
  };
}

test("PASS 0 — 005.14 version is registered", () => {
  assert.equal(PARASITE_EVIDENCE_SENTINEL_VERSION, "BE-FIX-005.14");
  assert.match(server, /parasiteEvidenceSentinelVersion/);
});

test("PASS 1 — educational parasite names cannot promote suspicion", () => {
  const result = baseResult("NOT_ASSESSABLE");
  result.morphologyAnalysis.differentialDiagnosis =
    "Plasmodium, Babesia e Trypanosoma como diferenciais educacionais.";
  result.findings.parasiteSuspected = true;
  result.finalClassification = "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";
  result.riskLevel = "Estrutura hemoparasitária suspeita";

  const out = applyParasiteEvidenceSentinel(result);
  assert.equal(out.findings.parasiteSuspected, false);
  assert.doesNotMatch(String(out.riskLevel), /hemoparasit/i);
});

test("PASS 2 — NOT_ASSESSABLE remains indeterminate", () => {
  const assessment = evaluateParasiteArtifactEvidence(
    baseResult("NOT_ASSESSABLE"),
  );
  assert.equal(assessment.parasitePromotionAllowed, false);
  assert.equal(assessment.parasiteTriState, "NOT_ASSESSABLE");
});

test("PASS 3 — NOT_OBSERVED remains field-scoped negative", () => {
  const result = baseResult("NOT_OBSERVED_IN_EVALUABLE_FIELD");
  result.findings.parasiteSuspected = true;
  const out = applyParasiteEvidenceSentinel(result);
  assert.equal(out.findings.parasiteSuspected, false);
});

test("PASS 4 — artifact evidence routes to artifact pathway", () => {
  const result = baseResult("NOT_ASSESSABLE");
  result.localMorphologyEvidence.field.artifacts = [
    "precipitado de corante / debris fora de foco",
  ];
  const out = applyParasiteEvidenceSentinel(result);
  assert.equal(out.parasiteEvidenceSentinel.artifactLikely, true);
  assert.equal(out.findings.parasiteSuspected, false);
  assert.match(out.parasiteAnalysis.interpretation, /artefato técnico\/óptico/i);
});

test("PASS 5 — OBSERVED parasite evidence preserves alert", () => {
  const out = applyParasiteEvidenceSentinel(baseResult("OBSERVED"));
  assert.equal(out.findings.parasiteSuspected, true);
  assert.equal(out.parasiteAnalysis.evidenceAuthority, "LME-1.0");
  assert.equal(out.normalityBlocked, true);
});

test("PASS 6 — blast alert has priority over parasite cleanup", () => {
  const result = baseResult("NOT_ASSESSABLE");
  result.singleBlastSentinel = { version: "BE-FIX-005.13", active: true };
  result.findings = { blastSuspicion: true, parasiteSuspected: true };
  result.finalClassification = "CLASS_4_BLAST_SUSPICION";
  result.morphologicRiskClass = "CLASS_4_BLAST_SUSPICION";
  result.riskLevel = "ALERTA CRÍTICO — suspeita de célula blástica/imatura";

  const out = applyParasiteEvidenceSentinel(result);
  assert.equal(out.findings.blastSuspicion, true);
  assert.equal(out.findings.parasiteSuspected, false);
  assert.equal(out.finalClassification, "CLASS_4_BLAST_SUSPICION");
  assert.equal(out.morphologicRiskClass, "CLASS_4_BLAST_SUSPICION");
});

test("PASS 7 — legacy global free-text scan is removed", () => {
  const start = server.indexOf("function detectHemoparasitePattern");
  const end = server.indexOf("function applyLimitedFieldFinalLock", start);
  const block = server.slice(start, end);
  assert.match(block, /evaluateParasiteArtifactEvidence/);
  assert.doesNotMatch(block, /JSON\.stringify\(result/);
  assert.doesNotMatch(block, /raw\.includes\("plasmodium"\)/);
});

test("PASS 8 — 005.14 runs after 005.13 and before negative rebuild", () => {
  const blast = server.lastIndexOf("applySingleBlastSentinel(");
  const parasite = server.lastIndexOf("applyParasiteEvidenceSentinel(");
  const negatives = server.lastIndexOf("applyFieldScopedNegativeFindings(");
  assert.ok(blast >= 0 && parasite > blast && negatives > parasite);
});
