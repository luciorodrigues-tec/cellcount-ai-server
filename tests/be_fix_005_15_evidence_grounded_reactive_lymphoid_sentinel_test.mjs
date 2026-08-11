import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import analyzeGlobalPattern from "../ai/globalPatternEngine.js";
import {
  REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
  evaluateReactiveLymphoidEvidence,
  applyReactiveLymphoidEvidenceSentinel,
} from "../ai/reactiveLymphoidEvidenceSentinel.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

function base() {
  return {
    rawResponse: {
      findings: {
        reactiveLymphocytes: false,
        atypicalLymphocytes: false,
        largeMononuclearCells: false,
        blastSuspicion: false,
      },
      visualEvidence: {
        abundantBasophilicCytoplasm: false,
        cellSizeIncrease: false,
        erythrocyteMolding: false,
        irregularCellBorders: false,
        prominentNucleolus: false,
      },
    },
    findings: {
      reactiveLymphocytes: false,
      atypicalLymphocytes: false,
      largeMononuclearCells: false,
      blastSuspicion: false,
    },
    visualEvidence: {},
    fieldAdequacy: {
      limitedField: true,
      adequateForPopulationAssessment: false,
      visibleLeukocytes: 7,
    },
    localMorphologyEvidence: {
      leukocytes: {
        description: "",
        atypia: "",
        cytoplasm: "",
        nuclearMorphology: "",
      },
    },
    morphologyAnalysis: {},
    patternRecognition: {},
    overallAssessment: {},
    structuredReport: {},
    differentialDiagnosis: [],
  };
}

test("PASS 0 — 005.15 version is registered", () => {
  assert.equal(
    REACTIVE_LYMPHOID_EVIDENCE_SENTINEL_VERSION,
    "BE-FIX-005.15",
  );
  assert.match(server, /reactiveLymphoidEvidenceSentinelVersion/);
});

test("PASS 1 — large mononuclear cell alone is not reactive", () => {
  const r = base();
  r.rawResponse.findings.largeMononuclearCells = true;
  r.findings.largeMononuclearCells = true;
  r.rawResponse.visualEvidence.cellSizeIncrease = true;

  const e = evaluateReactiveLymphoidEvidence(r);
  assert.equal(e.reactivePatternSupported, false);
  assert.equal(e.isolatedAtypicalMononuclearSignal, true);
});

test("PASS 2 — atypical lymphocyte alone is not automatically reactive", () => {
  const r = base();
  r.rawResponse.findings.atypicalLymphocytes = true;
  r.findings.atypicalLymphocytes = true;

  const e = evaluateReactiveLymphoidEvidence(r);
  assert.equal(e.reactivePatternSupported, false);
});

test("PASS 3 — reactive flag plus morphology support allows reactive pattern", () => {
  const r = base();
  r.rawResponse.findings.reactiveLymphocytes = true;
  r.rawResponse.visualEvidence.abundantBasophilicCytoplasm = true;
  r.rawResponse.visualEvidence.irregularCellBorders = true;

  const e = evaluateReactiveLymphoidEvidence(r);
  assert.equal(e.reactivePatternSupported, true);
});

test("PASS 4 — EBV/CMV language requires stronger evidence", () => {
  const r = base();
  r.rawResponse.findings.reactiveLymphocytes = true;
  r.rawResponse.visualEvidence.abundantBasophilicCytoplasm = true;

  const e = evaluateReactiveLymphoidEvidence(r);
  assert.equal(e.reactivePatternSupported, true);
  assert.equal(e.mononucleosisPatternSupported, false);
});

test("PASS 5 — unsupported reactive narrative is removed but atypia preserved", () => {
  const r = base();
  r.rawResponse.findings.largeMononuclearCells = true;
  r.findings.largeMononuclearCells = true;
  r.reactiveLymphoidPattern = true;
  r.morphologicRiskClass = "CLASS_2_ATYPICAL_REACTIVE_PATTERN";
  r.finalClassification = "CLASS_2_ATYPICAL_REACTIVE_PATTERN";
  r.riskLevel = "Padrão linfoide reacional/atípico";
  r.interpretiveSynthesis =
    "O padrão linfoide observado sugere ativação imunológica reacional e EBV.";
  r.clinicalMeaning =
    "Pode estar associado a síndrome mononucleósica.";
  r.morphologyAnalysis.summary =
    "Ativação linfoide reacional / população mononuclear atípica.";
  r.differentialDiagnosis = [
    "Mononucleose infecciosa por EBV",
    "Infecção por CMV",
    "Resposta imunológica reacional",
  ];

  const out = applyReactiveLymphoidEvidenceSentinel(r);

  assert.equal(out.reactiveLymphoidPattern, false);
  assert.equal(out.findings.largeMononuclearCells, true);
  assert.equal(out.morphologicRiskClass, "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL");
  assert.doesNotMatch(out.interpretiveSynthesis, /EBV|ativação linfoide reacional/i);
  assert.equal(
    out.differentialDiagnosis.some((x) => /EBV|CMV|mononucleose/i.test(x)),
    false,
  );
});

test("PASS 6 — global pattern engine does not call large mononuclear reactive", () => {
  const r = base();
  r.rawResponse.findings.largeMononuclearCells = true;
  r.findings.largeMononuclearCells = true;

  const g = analyzeGlobalPattern(r);
  assert.equal(g.dominantPattern, "ATYPICAL_MONONUCLEAR_PATTERN");
  assert.equal(g.ruleVersion, "GLOBAL_PATTERN_ENGINE_V2_BE_FIX_005_15");
});

test("PASS 7 — global pattern engine recognizes evidence-supported reactive pattern", () => {
  const r = base();
  r.rawResponse.findings.reactiveLymphocytes = true;
  r.findings.reactiveLymphocytes = true;
  r.rawResponse.visualEvidence.abundantBasophilicCytoplasm = true;
  r.rawResponse.visualEvidence.irregularCellBorders = true;

  const g = analyzeGlobalPattern(r);
  assert.equal(g.dominantPattern, "REACTIVE_LYMPHOID_PATTERN");
});

test("PASS 8 — blast sentinel priority is preserved", () => {
  const r = base();
  r.singleBlastSentinel = { active: true };
  r.findings.blastSuspicion = true;
  r.finalClassification = "CLASS_4_BLAST_SUSPICION";
  r.morphologicRiskClass = "CLASS_4_BLAST_SUSPICION";
  r.interpretiveSynthesis = "Suspeita blástica.";

  const out = applyReactiveLymphoidEvidenceSentinel(r);
  assert.equal(out.finalClassification, "CLASS_4_BLAST_SUSPICION");
  assert.equal(out.findings.blastSuspicion, true);
});

test("PASS 9 — parasite sentinel priority is preserved", () => {
  const r = base();
  r.parasiteEvidenceSentinel = {
    explicitPositiveParasiteEvidence: true,
  };
  r.findings.parasiteSuspected = true;
  r.finalClassification = "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";

  const out = applyReactiveLymphoidEvidenceSentinel(r);
  assert.equal(out.findings.parasiteSuspected, true);
  assert.equal(
    out.finalClassification,
    "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE",
  );
});

test("PASS 10 — final 005.15 runs after 005.14 and before negative rebuild", () => {
  const parasite = server.lastIndexOf("applyParasiteEvidenceSentinel(");
  const reactive = server.lastIndexOf("applyReactiveLymphoidEvidenceSentinel(");
  const negatives = server.lastIndexOf("applyFieldScopedNegativeFindings(");

  assert.ok(parasite >= 0 && reactive > parasite && negatives > reactive);
});

test("PASS 11 — normalizer no longer equates large mononuclear with reactive pattern", () => {
  const start = server.indexOf("function normalizeMedicalResponse");
  const end = server.indexOf("// ============================================================================\n// USER", start);
  const block = server.slice(start, end);

  assert.match(block, /evaluateReactiveLymphoidEvidence/);
  assert.doesNotMatch(
    block,
    /const reactiveLymphoidPattern[\s\S]{0,500}findings\.largeMononuclearCells/,
  );
});
