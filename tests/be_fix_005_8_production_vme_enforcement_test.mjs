import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  PRODUCTION_VME_ENFORCEMENT_VERSION,
  VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
  assessVisualMorphologyEvidenceAcquisition,
  buildPrimaryVisualMorphologyAcquisitionPrompt,
  buildVisualMorphologyAcquisitionResponseFormat,
  shouldAttemptVisualMorphologyRepair,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

const structuredAcquisition = {
  observedMorphology: {
    globalField: "Campo com hemácias e seis células nucleadas diretamente visíveis.",
    technicalQuality: "Foco suficiente para descrição morfológica local.",
    representativity: "Campo único; inferência populacional global limitada.",
    erythrocytes: {
      description: "Hemácias numerosas diretamente observáveis no campo.",
      size: "variação discreta aparente no campo",
      chromia: "parcialmente avaliável",
      anisocytosis: "discreta no campo",
      poikilocytosis: "não evidente no campo avaliável",
      specificForms: [],
      artifactConsiderations: "Iluminação heterogênea interfere parcialmente.",
    },
    leukocytes: {
      description: "Seis elementos nucleados diretamente visíveis, com variação morfológica.",
      approximateVisibleCells: 6,
      countStatus: "OBSERVED_COUNT",
      heterogeneity: "heterogênea no campo",
      nuclearMorphology: "núcleos arredondados a discretamente irregulares",
      chromatin: "intermediária",
      nucleoli: "não avaliáveis com segurança",
      cytoplasm: "volume variável e parcialmente avaliável",
      maturation: "indeterminada sem generalização populacional",
      atypia: "sem critérios suficientes para classificação definitiva",
      blastLikeFeatures: "sem conjunto convincente de critérios blásticos",
    },
    platelets: {
      description: "Pequenos elementos plaquetários púrpura diretamente visíveis.",
      distribution: "dispersos no campo",
      size: "indeterminada",
      aggregates: "não evidentes no campo avaliável",
    },
    artifacts: [],
    positiveEvidence: ["Células nucleadas diretamente observadas"],
    uncertainty: ["Representatividade populacional limitada"],
  },
  fieldAdequacy: {
    visibleLeukocytes: 6,
    adequateForLeukocyteAnalysis: true,
    adequateForBlastScreening: true,
    adequateForPopulationAssessment: false,
    limitedField: true,
    limitationReason: "Campo único com representatividade populacional limitada.",
  },
  imageQuality: {
    classification: "moderada",
    description: "Estruturas celulares localmente avaliáveis.",
    limitations: ["Iluminação heterogênea"],
  },
  findings: {
    reactiveLymphocytes: false,
    largeMononuclearCells: false,
    plasmacytoidCells: false,
    plasmocytes: false,
    plasmablasts: false,
    atypicalLymphocytes: false,
    monomorphicPopulation: false,
    immatureCells: false,
    blastSuspicion: false,
  },
  visualEvidence: {
    cellSizeIncrease: false,
    abundantBasophilicCytoplasm: false,
    erythrocyteMolding: false,
    irregularCellBorders: false,
    eccentricNucleus: false,
    prominentNucleolus: false,
  },
  positiveFindings: [],
  negativeFindingsStructured: [],
  heatmapRegions: [],
};

test("PASS 0 — production VME profile retains VME-1.0 and exposes 005.8 enforcement", () => {
  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: structuredAcquisition,
    analysisSource: "ai_visual",
  });

  assert.equal(result.contractVersion, VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION);
  assert.equal(result.productionEnforcementVersion, PRODUCTION_VME_ENFORCEMENT_VERSION);
  assert.equal(PRODUCTION_VME_ENFORCEMENT_VERSION, "BE-FIX-005.8");
  assert.equal(result.complete, true);
  console.log("PASS 0 — VME-1.0 contract preserved with BE-FIX-005.8 production enforcement");
});

test("PASS 1 — structured output schema makes morphology containers mandatory", () => {
  const format = buildVisualMorphologyAcquisitionResponseFormat();
  const schema = format.json_schema.schema;

  assert.equal(format.type, "json_schema");
  assert.equal(format.json_schema.strict, true);
  assert.ok(schema.required.includes("observedMorphology"));
  assert.ok(schema.required.includes("fieldAdequacy"));
  assert.ok(schema.required.includes("findings"));
  assert.ok(schema.properties.observedMorphology.required.includes("leukocytes"));
  assert.ok(
    schema.properties.observedMorphology.properties.leukocytes.required.includes(
      "approximateVisibleCells",
    ),
  );
  assert.ok(
    schema.properties.observedMorphology.properties.leukocytes.required.includes(
      "nuclearMorphology",
    ),
  );
  assert.ok(
    schema.properties.observedMorphology.properties.leukocytes.required.includes(
      "cytoplasm",
    ),
  );
  console.log("PASS 1 — strict schema prevents boolean-only output from satisfying primary acquisition");
});

test("PASS 2 — primary prompt separates UNKNOWN count from observed zero", () => {
  const prompt = buildPrimaryVisualMorphologyAcquisitionPrompt();
  assert.match(prompt, /Nunca use 0\s+para significar desconhecido/i);
  assert.match(prompt, /countStatus="NOT_ASSESSABLE"/i);
  assert.match(prompt, /Campo limitado.*NÃO apaga morfologia/is);
  assert.ok(prompt.length < 3500, `primary VME prompt unexpectedly long: ${prompt.length}`);
  console.log("PASS 2 — compact primary prompt preserves UNKNOWN semantics and local morphology");
});

test("PASS 3 — latency budget suppresses automatic second 80s-class image call", () => {
  const incomplete = { retryRecommended: true };

  assert.equal(
    shouldAttemptVisualMorphologyRepair({
      acquisition: incomplete,
      primaryElapsedMs: 80000,
      repairEnabled: true,
      latencyBudgetMs: 45000,
    }),
    false,
  );

  assert.equal(
    shouldAttemptVisualMorphologyRepair({
      acquisition: incomplete,
      primaryElapsedMs: 15000,
      repairEnabled: false,
      latencyBudgetMs: 45000,
    }),
    false,
  );

  assert.equal(
    shouldAttemptVisualMorphologyRepair({
      acquisition: incomplete,
      primaryElapsedMs: 15000,
      repairEnabled: true,
      latencyBudgetMs: 45000,
    }),
    true,
  );
  console.log("PASS 3 — repair is opt-in and constrained by primary-call latency budget");
});

test("PASS 4 — null visible count remains incomplete instead of becoming zero", () => {
  const unknownCount = structuredClone(structuredAcquisition);
  unknownCount.observedMorphology.leukocytes.approximateVisibleCells = null;
  unknownCount.observedMorphology.leukocytes.countStatus = "NOT_ASSESSABLE";
  unknownCount.fieldAdequacy.visibleLeukocytes = null;

  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: unknownCount,
    analysisSource: "ai_visual",
  });

  assert.equal(result.complete, false);
  assert.equal(result.acquiredDomains.visibleLeukocyteCount, null);
  assert.ok(result.missingRequirements.includes("visible_leukocyte_count"));
  console.log("PASS 4 — NOT_ASSESSABLE leukocyte count is not coerced to numeric zero");
});

test("PASS 5 — server enforces structured VME before LME with low reasoning profile", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  const productionIndex = server.indexOf("BE-FIX-005.8 — VME PRODUCTION ENFORCEMENT");
  const vmeIndex = server.indexOf("VME-1.0 — INITIAL ACQUISITION");
  const lmeIndex = server.indexOf("LOCAL MORPHOLOGY EVIDENCE — CAPTURED");

  assert.ok(productionIndex > 0, "005.8 production enforcement marker missing");
  assert.ok(vmeIndex > productionIndex, "VME assessment must follow production acquisition");
  assert.ok(lmeIndex > vmeIndex, "LME must remain downstream of VME");
  assert.match(server, /buildVisualMorphologyAcquisitionResponseFormat/);
  assert.match(server, /OPENAI_VISION_REASONING_EFFORT \|\| "low"/);
  assert.match(server, /VME_REPAIR_ENABLED \|\| "false"/);
  assert.match(server, /shouldAttemptVisualMorphologyRepair/);
  console.log("PASS 5 — server uses strict structured VME, low reasoning and opt-in budgeted repair");
});

test("PASS 6 — deploy fingerprint makes production version externally auditable", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");
  assert.match(server, /PRODUCTION_VME_ENFORCEMENT_VERSION/);
  assert.match(server, /vmeProductionEnforcement/);
  assert.match(server, /PIPELINE ENTERPRISE V6 SAFE HYBRID ONLINE/);
  console.log("PASS 6 — analysis metadata/startup fingerprint exposes BE-FIX-005.8 deployment");
});

console.log("\n================================================================");
console.log("BE-FIX-005.8 — PRODUCTION VME ENFORCEMENT: TESTS REGISTERED");
console.log("================================================================");
