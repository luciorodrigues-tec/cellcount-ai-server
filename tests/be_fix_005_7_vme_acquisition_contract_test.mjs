import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION,
  assessVisualMorphologyEvidenceAcquisition,
  buildVisualMorphologyRepairPrompt,
  mergeVisualMorphologyRepair,
  visualMorphologyEvidenceAcquisitionContractStatus,
} from "../ai/visualMorphologyEvidenceAcquisitionContract.js";

const incompleteRealWorldShape = {
  visualEvidence: {
    cellSizeIncrease: false,
    abundantBasophilicCytoplasm: false,
    erythrocyteMolding: false,
    irregularCellBorders: false,
    eccentricNucleus: false,
    prominentNucleolus: false,
  },
  heatmapRegions: [],
};

const repairedMorphology = {
  observedMorphology: {
    globalField: "Campo com hemácias e múltiplos elementos nucleados diretamente visíveis.",
    technicalQuality: "Foco parcialmente heterogêneo, porém estruturas celulares avaliáveis.",
    representativity: "Campo único; não permite inferência populacional global.",
    erythrocytes: {
      description: "Hemácias numerosas visíveis, com avaliação morfológica restrita ao campo.",
      size: "variação discreta aparente no campo",
      chromia: "avaliável parcialmente",
      anisocytosis: "discreta no campo",
      poikilocytosis: "não evidente entre as hemácias avaliáveis",
      specificForms: [],
      artifactConsiderations: "Há interferência de iluminação/preparo.",
    },
    leukocytes: {
      description: "Elementos mononucleares e outros leucócitos nucleados são diretamente visíveis no campo.",
      approximateVisibleCells: 6,
      heterogeneity: "heterogêneo no campo",
      nuclearMorphology: "núcleos redondos a discretamente irregulares",
      chromatin: "intermediária",
      nucleoli: "não avaliáveis com segurança",
      cytoplasm: "volume variável, parcialmente avaliável",
      maturation: "indeterminada sem generalização populacional",
      atypia: "sem classificação definitiva",
      blastLikeFeatures: "não há conjunto citomorfológico suficiente para afirmar blasto",
    },
    platelets: {
      description: "Pequenos elementos plaquetários púrpura são visíveis no campo.",
      distribution: "dispersas",
      size: "indeterminada",
      aggregates: "não evidentes no campo avaliável",
    },
    artifacts: [],
    positiveEvidence: ["Elementos nucleados diretamente observados"],
    uncertainty: ["Representatividade populacional limitada"],
  },
  fieldAdequacy: {
    visibleLeukocytes: 6,
    adequateForLeukocyteAnalysis: true,
    adequateForBlastScreening: true,
    adequateForPopulationAssessment: false,
    limitedField: true,
    limitationReason: "Campo único com baixa representatividade populacional.",
  },
};

test("PASS 0 — VME-1.0 rejects boolean-only visual response", () => {
  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: incompleteRealWorldShape,
    analysisSource: "ai_visual",
  });

  assert.equal(result.contractVersion, VISUAL_MORPHOLOGY_EVIDENCE_ACQUISITION_VERSION);
  assert.equal(result.complete, false);
  assert.equal(result.status, "INCOMPLETE_VISUAL_EVIDENCE");
  assert.equal(result.retryRecommended, true);
  assert.ok(result.missingRequirements.includes("morphology_container"));
  assert.ok(result.missingRequirements.includes("leukocyte_description"));
  assert.ok(result.missingRequirements.includes("visible_leukocyte_count"));

  console.log("PASS 0 — boolean-only visual response is INCOMPLETE_VISUAL_EVIDENCE");
});

test("PASS 1 — repair merge converts incomplete acquisition into complete VME", () => {
  const merged = mergeVisualMorphologyRepair(
    incompleteRealWorldShape,
    repairedMorphology,
  );

  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: merged,
    analysisSource: "ai_visual",
  });

  assert.equal(result.complete, true);
  assert.equal(result.status, "COMPLETE");
  assert.equal(result.acquiredDomains.visibleLeukocyteCount, 6);
  assert.equal(result.acquiredDomains.leukocyteMorphologyDetail, true);
  assert.equal(merged.visualEvidence.cellSizeIncrease, false);

  console.log("PASS 1 — focused repair produces complete morphology acquisition");
});

test("PASS 2 — limited field remains compatible with concrete morphology", () => {
  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: repairedMorphology,
    analysisSource: "ai_visual",
  });

  assert.equal(result.complete, true);
  assert.equal(repairedMorphology.fieldAdequacy.limitedField, true);
  assert.match(
    repairedMorphology.observedMorphology.leukocytes.description,
    /diretamente visíveis/i,
  );

  console.log("PASS 2 — LIMITED_FIELD does not invalidate acquired local morphology");
});

test("PASS 3 — repair prompt requires NOT_ASSESSABLE semantics instead of invention", () => {
  const prompt = buildVisualMorphologyRepairPrompt({
    missingRequirements: ["leukocyte_morphology_detail"],
  });

  assert.match(prompt, /não avaliável/i);
  assert.match(prompt, /não transformar.*ausência global/i);
  assert.match(prompt, /morfologia concreta/i);

  console.log("PASS 3 — repair prompt requires explicit non-assessability and field-scoped negatives");
});

test("PASS 4 — VME contract metadata is internally valid", () => {
  const result = assessVisualMorphologyEvidenceAcquisition({
    visionResponse: repairedMorphology,
    analysisSource: "ai_visual",
  });
  const status = visualMorphologyEvidenceAcquisitionContractStatus(result);

  assert.deepEqual(status, { valid: true, problems: [] });
  assert.equal(result.invariants.incompleteEvidenceIsNotNegativeMorphology, true);
  assert.equal(result.invariants.morphologyRequiredBeforeInterpretation, true);

  console.log("PASS 4 — VME-1.0 contract invariants are valid");
});

test("PASS 5 — server integrates VME before LME capture and uses one focused repair pass", () => {
  const server = fs.readFileSync(new URL("../server.js", import.meta.url), "utf8");

  const vmeIndex = server.indexOf("VME-1.0 — INITIAL ACQUISITION");
  const lmeIndex = server.indexOf("LOCAL MORPHOLOGY EVIDENCE — CAPTURED");

  assert.ok(vmeIndex > 0, "VME integration marker missing");
  assert.ok(lmeIndex > vmeIndex, "VME must execute before LME capture");
  assert.match(server, /buildVisualMorphologyRepairPrompt/);
  assert.match(server, /mergeVisualMorphologyRepair/);
  assert.match(server, /visualEvidenceAcquisitionIncomplete/);

  console.log("PASS 5 — server acquisition gate precedes LME and preserves VME provenance");
});

console.log("\n================================================================");
console.log("BE-FIX-005.7 — VME-1.0 ACQUISITION CONTRACT: TESTS REGISTERED");
console.log("================================================================");
