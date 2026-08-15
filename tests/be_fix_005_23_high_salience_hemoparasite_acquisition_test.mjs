import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  HEMOPARASITE_HIGH_SALIENCE_ACQUISITION_VERSION,
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  buildVisualMorphologyAcquisitionResponseFormat,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";
import {
  HEMOPARASITE_HIGH_SALIENCE_LME_VERSION,
  createLocalMorphologyEvidence,
} from "../ai/localMorphologyEvidenceContract.js";
import {
  HEMOPARASITE_HIGH_SALIENCE_SENTINEL_VERSION,
  applyParasiteEvidenceSentinel,
  evaluateParasiteArtifactEvidence,
} from "../ai/parasiteEvidenceSentinel.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

function visionParasite(overrides = {}) {
  return {
    observedMorphology: {
      globalField: "Campo com hemácias e múltiplas estruturas extracelulares alongadas.",
      technicalQuality: "adequada",
      representativity: "campo isolado",
      erythrocytes: { description: "Hemácias visíveis." },
      leukocytes: { description: "Leucócitos visíveis.", approximateVisibleCells: 2 },
      platelets: { description: "Plaquetas visíveis." },
      parasites: {
        evidenceState: "OBSERVED",
        approximateVisibleForms: 6,
        phenotype: "TRYPANOSOMATID_LIKE",
        morphology: "Formas extracelulares alongadas e curvas com membrana ondulante aparente.",
        extracellular: true,
        elongatedOrCurved: true,
        undulatingMembraneLike: true,
        flagellumLike: true,
        kinetoplastLike: false,
        intracellularForms: false,
        artifactDifferential: "Fibra/precipitado considerados, porém morfologia repetida e coerente.",
        confidence: "high",
        ...overrides,
      },
      artifacts: [], positiveEvidence: [], uncertainty: [],
    },
    fieldAdequacy: { visibleLeukocytes: 2, adequateForBlastScreening: false },
    findings: {},
  };
}

test("PASS 0 — 005.23 acquisition/LME/sentinel versions are registered", () => {
  assert.equal(HEMOPARASITE_HIGH_SALIENCE_ACQUISITION_VERSION, "BE-FIX-005.23");
  assert.equal(HEMOPARASITE_HIGH_SALIENCE_LME_VERSION, "BE-FIX-005.23");
  assert.equal(HEMOPARASITE_HIGH_SALIENCE_SENTINEL_VERSION, "BE-FIX-005.23");
});

test("PASS 1 — VME prompt explicitly requires extracellular hemoparasite high-salience scan", () => {
  const prompt = buildPrimaryVisualMorphologyAcquisitionPrompt();
  assert.match(prompt, /ALTA SALIÊNCIA/i);
  assert.match(prompt, /extracelulares/i);
  assert.match(prompt, /TRYPANOSOMATID_LIKE/);
});

test("PASS 2 — strict VME schema contains structured parasite morphology", () => {
  const fmt = buildVisualMorphologyAcquisitionResponseFormat();
  const parasites = fmt.json_schema.schema.properties.observedMorphology.properties.parasites;
  assert.ok(parasites);
  assert.ok(parasites.properties.evidenceState);
  assert.ok(parasites.properties.phenotype);
  assert.ok(parasites.properties.undulatingMembraneLike);
  assert.ok(fmt.json_schema.schema.properties.observedMorphology.required.includes("parasites"));
});

test("PASS 3 — observed trypanosomatid-like morphology is projected into LME as OBSERVED", () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: visionParasite() });
  assert.equal(lme.criticalMorphology.parasites, "OBSERVED");
  assert.equal(lme.criticalMorphology.parasiteEvidence.phenotype, "TRYPANOSOMATID_LIKE");
  assert.equal(lme.criticalMorphology.parasiteEvidence.approximateVisibleForms, 6);
});

test("PASS 4 — structured repeated extracellular morphology authorizes parasite promotion", () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: visionParasite() });
  const assessment = evaluateParasiteArtifactEvidence({ localMorphologyEvidence: lme });
  assert.equal(assessment.explicitPositiveParasiteEvidence, true);
  assert.equal(assessment.trypanosomatidLike, true);
  assert.equal(assessment.parasitePromotionAllowed, true);
});

test("PASS 5 — sentinel preserves Trypanosomatid-like alert without claiming species", () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: visionParasite() });
  const out = applyParasiteEvidenceSentinel({
    localMorphologyEvidence: lme,
    findings: {}, fieldAdequacy: {}, parasiteAnalysis: {},
  });
  assert.equal(out.findings.parasiteSuspected, true);
  assert.equal(out.parasiteAnalysis.parasiteType, "TRYPANOSOMATID_LIKE");
  assert.match(out.parasiteAnalysis.parasiteName, /tripanossomat/i);
  assert.doesNotMatch(out.parasiteAnalysis.parasiteName, /cruzi/i);
});

test("PASS 6 — suspicious morphology is not promoted to observed parasite", () => {
  const lme = createLocalMorphologyEvidence({ visionResponse: visionParasite({ evidenceState: "SUSPICIOUS_INDETERMINATE", confidence: "moderate" }) });
  const assessment = evaluateParasiteArtifactEvidence({ localMorphologyEvidence: lme });
  assert.equal(assessment.parasitePromotionAllowed, false);
  assert.equal(assessment.trypanosomatidLike, false);
});

test("PASS 7 — server projects high-salience Trypanosomatid-like evidence as TRYPANOSOMA_SUSPECT", () => {
  const start = server.indexOf("function detectHemoparasitePattern");
  const end = server.indexOf("function applyLimitedFieldFinalLock", start);
  const block = server.slice(start, end);
  assert.match(block, /trypanosomatidLike/);
  assert.match(block, /TRYPANOSOMA_SUSPECT/);
  assert.match(block, /não permite identificação de espécie/i);
});

