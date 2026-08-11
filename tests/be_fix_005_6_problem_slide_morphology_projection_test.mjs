import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createLocalMorphologyEvidence,
  localMorphologyEvidenceContractStatus,
} from "../ai/localMorphologyEvidenceContract.js";
import {
  createAcademicMorphologyReasoning,
} from "../ai/academicMorphologyReasoningContract.js";
import applyFinalClinicalGovernor from "../ai/finalClinicalGovernor.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function pass(n, text) {
  console.log(`PASS ${n} — ${text}`);
}

// Fixture reproduces the failure mode seen in the real app: adequacy-only text
// is present in legacy narrative slots, while structured local morphology is
// also available and must remain authoritative.
const raw = {
  observedMorphology: {
    globalField:
      "Campo microscópico com baixa representatividade celular. Recomenda-se avaliação de múltiplos campos.",
    erythrocytes: {
      description:
        "Avaliação limitada ao campo enviado. Não afirmar morfologia eritrocitária global preservada.",
      size: "predomínio de hemácias de tamanho aparentemente semelhante entre as avaliáveis",
      chromia: "cromia de avaliação parcial pela iluminação",
      anisocytosis: "não estabelecida globalmente; discreta variação entre as hemácias avaliáveis",
      poikilocytosis: "não estabelecida globalmente",
    },
    leukocytes: {
      description:
        "Avaliação leucocitária limitada pela representatividade do campo. A imagem isolada não permite caracterização populacional confiável nem exclusão global de células imaturas.",
      approximateVisibleCells: 5,
      heterogeneity: "há mais de um padrão morfológico entre os elementos nucleados visíveis",
      nuclearMorphology: "núcleos predominantemente arredondados a ovalados nas células avaliáveis",
      chromatin: "cromatina de condensação variável entre os elementos observados",
      nucleoli: "não avaliáveis com segurança em todos os elementos",
      cytoplasm: "citoplasma basofílico em parte dos elementos nucleados visíveis",
      maturation: "indeterminada no conjunto limitado, porém individualmente descritível",
    },
    platelets: {
      description:
        "Avaliação plaquetária limitada pela representatividade do campo.",
      distribution: "elementos plaquetários esparsos no campo avaliável",
      size: "sem estimativa global confiável",
      aggregates: "não avaliáveis globalmente",
    },
  },
  academicInterpretation: {
    differentialConsiderations: [
      "Padrões reacionais versus variação de maturação devem ser diferenciados pela citomorfologia e por múltiplos campos.",
    ],
    confirmationNeeds: [
      "Avaliação de múltiplos campos e correlação com hemograma.",
    ],
  },
  fieldAdequacy: {
    visibleLeukocytes: 5,
    adequateForPopulationAssessment: false,
    limitedField: true,
  },
};

const lme = createLocalMorphologyEvidence({ visionResponse: raw });

assert.equal(lme.contractVersion, "LME-1.0");
assert.equal(lme.leukocytes.description, "");
assert.equal(lme.platelets.description, "");
assert.equal(lme.erythrocytes.description, "");
assert.match(lme.leukocytes.chromatin, /cromatina/i);
assert.match(lme.platelets.distribution, /plaquet/i);
assert.equal(localMorphologyEvidenceContractStatus(lme).valid, true);
pass(0, "adequacy-only prose is rejected as local morphology");

const amr = createAcademicMorphologyReasoning({
  localMorphologyEvidence: lme,
  fieldAdequacy: {
    limitedField: true,
    adequateForPopulationAssessment: false,
    populationInferenceAllowed: false,
  },
});

assert.equal(amr.reasoningScope, "FIELD_SCOPED");
assert.ok(amr.morphologicFeatures.length >= 6);
assert.ok(amr.whatItResembles.length >= 1);
pass(1, "AMR retains structured morphology and legacy academic differential");

const governed = applyFinalClinicalGovernor({
  localMorphologyEvidence: lme,
  fieldAdequacy: {
    contractVersion: "FA-4.0",
    visibleLeukocytes: 5,
    adequateForPopulationAssessment: false,
    limitedField: true,
    populationInferenceAllowed: false,
    morphologyDescriptionAllowed: true,
    localMorphologyEvidencePreserved: true,
    globalNegativeExclusionAllowed: false,
  },
  findings: {},
  morphologyAnalysis: {},
  structuredReport: {},
  confidenceAnalysis: {},
});

assert.equal(governed.finalClassification, "CLASS_1_LIMITED_FIELD");
assert.equal(governed.evidenceGovernance.morphologyDescriptionAllowed, true);
assert.deepEqual(governed.localMorphologyEvidence, lme);
pass(2, "final governor limits inference without mutating structured LME");

const serverSource = fs.readFileSync(path.join(root, "server.js"), "utf8");
assert.match(serverSource, /isAdequacyOnlyNarrative/);
assert.match(
  serverSource,
  /isAdequacyOnlyNarrative\(preserved\.hematologicReasoning\.whatISee\)/,
);
assert.match(serverSource, /buildStructuredSeriesDescription/);
pass(3, "final UI compatibility bridge replaces adequacy-only morphology slots");

console.log("\n================================================================");
console.log("BE-FIX-005.6 — PROBLEM SLIDE MORPHOLOGY PROJECTION: ALL PASSED");
console.log("================================================================");
