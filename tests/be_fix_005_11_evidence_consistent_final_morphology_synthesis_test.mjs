import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyFieldAdequacyRules,
} from "../ai/fieldAdequacyEngine.js";
import {
  applyEvidenceConsistentFinalMorphologySynthesis,
  EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION,
} from "../ai/evidenceConsistentMorphologySynthesis.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

function lme(overrides = {}) {
  return {
    contractVersion: "LME-1.0",
    evidenceAvailable: true,
    field: { description: "Campo avaliável localmente." },
    erythrocytes: { description: "Hemácias observáveis sem alteração específica neste campo." },
    leukocytes: {
      observedCellCount: 7,
      description: "Células mononucleares aumentadas observadas.",
      heterogeneity: "Heterogeneidade presente.",
      nuclearMorphology: "Núcleos irregulares.",
      chromatin: "Cromatina moderadamente condensada.",
      nucleoli: "Nucléolos não proeminentes.",
      cytoplasm: "Citoplasma basofílico moderado.",
      atypia: "Atipia mononuclear observada.",
    },
    platelets: { description: "Plaquetas dispersas visíveis." },
    criticalMorphology: {
      parasites: "NOT_ASSESSABLE",
      blastLikeMorphology: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
    },
    positiveEvidence: ["Células mononucleares aumentadas."],
    ...overrides,
  };
}

test("PASS 0 — 005.11 runtime fingerprint is registered", () => {
  assert.equal(EVIDENCE_CONSISTENT_MORPHOLOGY_SYNTHESIS_VERSION, "BE-FIX-005.11");
  assert.match(server, /evidenceConsistentMorphologySynthesisVersion/);
});

test("PASS 1 — negative/indeterminate parasite language cannot create parasite suspicion", () => {
  const result = applyFieldAdequacyRules({
    localMorphologyEvidence: lme(),
    fieldAdequacy: { visibleLeukocytes: 7 },
    findings: {},
    morphologyAnalysis: {},
    whatAISees: {
      negativeFindings: "Não há formas eritrocitárias parasitárias identificáveis neste campo.",
    },
    overallAssessment: {},
    patternRecognition: {},
    structuredReport: {},
  });

  assert.equal(result.fieldAdequacy.parasiteSignal, false);
  assert.notEqual(result.findings.parasiteSuspected, true);
});

test("PASS 2 — unusual structure does not automatically become hemoparasite", () => {
  const result = applyFieldAdequacyRules({
    localMorphologyEvidence: lme(),
    fieldAdequacy: { visibleLeukocytes: 7 },
    findings: {},
    morphologyAnalysis: {},
    whatAISees: { unusualStructures: "Estrutura incomum/artefato a esclarecer." },
    overallAssessment: {},
    patternRecognition: {},
    structuredReport: {},
  });

  assert.equal(result.fieldAdequacy.unusualStructureSignal, true);
  assert.equal(result.fieldAdequacy.parasiteSignal, false);
  assert.equal(result.findings.parasiteSuspected, false);
});

test("PASS 3 — explicit OBSERVED parasite evidence remains positive", () => {
  const result = applyFieldAdequacyRules({
    localMorphologyEvidence: lme({
      criticalMorphology: { parasites: "OBSERVED" },
      positiveEvidence: ["Hemoparasita morfologicamente suspeito observado."],
    }),
    fieldAdequacy: { visibleLeukocytes: 7 },
    findings: {},
    morphologyAnalysis: {},
    whatAISees: {},
    overallAssessment: {},
    patternRecognition: {},
    structuredReport: {},
  });

  assert.equal(result.fieldAdequacy.parasiteSignal, true);
  assert.equal(result.findings.parasiteSuspected, true);
});

test("PASS 4 — LME nuclear/cytoplasmic/heterogeneity details project into morphologyAnalysis", () => {
  const result = applyEvidenceConsistentFinalMorphologySynthesis({
    localMorphologyEvidence: lme(),
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
    findings: { largeMononuclearCells: true, parasiteSuspected: true },
    finalClassification: "CLASS_1_LIMITED_FIELD",
    morphologicRiskClass: "CLASS_1_LIMITED_FIELD",
    riskLevel: "Campo limitado",
    morphologyAnalysis: {
      visualMorphologyDescription: {
        globalView: "Campo limitado.",
        nuclearFeatures: "",
        cytoplasmicFeatures: "",
        populationHeterogeneity: "",
      },
    },
  });

  const v = result.morphologyAnalysis.visualMorphologyDescription;
  assert.match(v.nuclearFeatures, /Núcleos irregulares/);
  assert.match(v.nuclearFeatures, /Cromatina/);
  assert.match(v.cytoplasmicFeatures, /Citoplasma basofílico/);
  assert.equal(v.populationHeterogeneity, "Heterogeneidade presente.");
  assert.equal(result.findings.parasiteSuspected, false);
});

test("PASS 5 — LIMITED_FIELD preserves positive local atypical morphology classification", () => {
  const result = applyEvidenceConsistentFinalMorphologySynthesis({
    localMorphologyEvidence: lme(),
    fieldAdequacy: {
      limitedField: true,
      populationInferenceAllowed: false,
    },
    findings: { largeMononuclearCells: true },
    finalClassification: "CLASS_1_LIMITED_FIELD",
    morphologicRiskClass: "CLASS_1_LIMITED_FIELD",
    riskLevel: "Campo limitado",
    morphologyAnalysis: {},
  });

  assert.equal(result.finalClassification, "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL");
  assert.equal(result.morphologicRiskClass, "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL");
  assert.match(result.riskLevel, /morfologia local atípica/i);
});

test("PASS 6 — final server applies 005.11 after final AMR projection", () => {
  const amr = server.indexOf("projectAcademicMorphologyReasoningCompatibility(");
  const synth = server.lastIndexOf("applyEvidenceConsistentFinalMorphologySynthesis(");
  assert.ok(amr >= 0 && synth > amr);
});
