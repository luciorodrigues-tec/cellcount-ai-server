// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// CELLCOUNT HEMATOLOGY ENTERPRISE SERVER V6 SAFE HYBRID
// ============================================================================

import validateConsistency
  from "./utils/validateConsistency.js";

import {
  applyFieldAdequacyRules,
} from "./ai/fieldAdequacyEngine.js";

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "crypto";

import {
  performance,
} from "perf_hooks";

import {
  correlateHematology,
} from './services/medicalCorrelationEngine.js';

// ============================================================================
// ENGINES
// ============================================================================

import {
  analyzeErythrocytes,
} from "./ai/erythrocyteEngine.js";

import {
  analyzeLeukocytes,
} from "./ai/leukocyteEngine.js";

import {
  analyzePlatelets,
} from "./ai/plateletEngine.js";

import {
  buildDiagnosticCorrelation,
} from "./ai/diagnosticCorrelationEngine.js";

import {
  buildConfidenceAnalysis,
} from "./ai/confidenceEngine.js";

import {
  calculateReactiveLymphocyteScore,
} from "./ai/reactiveLymphocyteEngine.js";

import {
  calculateBlastMimicRisk,
} from "./ai/blastMimicEngine.js";

import {
  classifyLymphoidPattern,
} from './ai/lymphoidPatternEngine.js';

import analyzeGlobalPattern
from './ai/globalPatternEngine.js';

import {
  sanitizeHematologyLanguage,
} from "./ai/hematologySemanticGuard.js";

import {
  applyAntiOvercallingRules,
} from "./ai/antiOvercallingEngine.js";

import {
  validateHematologyAnalysis,
} from "./ai/hematologySafetyEngine.js";

import {
  buildHematologyConsensus,
} from "./ai/hematologyConsensusEngine.js";

// ============================================================================
// IMAGE ENGINE
// ============================================================================

import {
  enhanceMicroscopyImage,
  buildGPTImagePayload,
} from "./ai/imageEnhancer.js";

// ============================================================================
// ENV
// ============================================================================

dotenv.config();

console.log(
  "🔑 OpenAI API:",
  process.env.OPENAI_API_KEY
    ? "CONFIGURADA"
    : "NÃO CONFIGURADA",
);

console.log(
  "🧠 Modelo:",
  process.env.OPENAI_MODEL || "gpt-4.1",
);

// ============================================================================
// APP
// ============================================================================

const app = express();

// ============================================================================
// CONFIG
// ============================================================================

const PORT =
  process.env.PORT || 3000;

const API_TOKEN =
  process.env.API_TOKEN ||
  "cellcount_enterprise_2026_secure_ai_v4";

const OPENAI_MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-4.1";

// ============================================================================
// OPENAI
// ============================================================================

const openai = new OpenAI({

  apiKey:
    process.env.OPENAI_API_KEY,
});

// ============================================================================
// CORS
// ============================================================================

app.use(

  cors({

    origin: "*",

    methods: [

      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [

      "Content-Type",
      "Authorization",
      "x-user-id",
    ],
  }),
);

app.options("/*", cors());

// ============================================================================
// EXPRESS
// ============================================================================

app.use(express.json({

  limit: "50mb",
}));

app.use(express.urlencoded({

  extended: true,

  limit: "50mb",
}));

// ============================================================================
// MULTER
// ============================================================================

const upload = multer({

  storage:
    multer.memoryStorage(),

  limits: {

    fileSize:
      25 * 1024 * 1024,

    files: 4,
  },
});

// ============================================================================
// USERS
// ============================================================================

const users = new Map();

// ============================================================================
// LOGGER
// ============================================================================

function logStep(
  requestId,
  step,
  start,
) {

  const elapsed =
    Math.round(
      performance.now() - start,
    );

  console.log(
    `🧠 [${requestId}] ${step} - ${elapsed}ms`,
  );

  return elapsed;
}

// ============================================================================
// REQUEST ID
// ============================================================================

function generateRequestId() {

  return crypto.randomUUID();
}

// ============================================================================
// SAFE JSON PARSE
// ============================================================================

function safeJsonParse(
  text = "{}",
) {

  try {

    return JSON.parse(text);

  } catch (error) {

    console.error(
      "SAFE JSON PARSE ERROR:",
      error,
    );

    return {};
  }
}

// ============================================================================
// NORMALIZE RESPONSE
// ============================================================================

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;

  if (value === null || value === undefined) return false;

  const text = String(value).toLowerCase().trim();

  if (
    [
      "true",
      "yes",
      "sim",
      "present",
      "presente",
      "detected",
      "detectado",
      "suspected",
      "suspeito",
      "positive",
      "positivo",
    ].includes(text)
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// SANITIZE NARRATIVE REPETITION
// ============================================================================

function cleanRepeatedSentences(text = "") {
  if (typeof text !== "string") return text;

  const sentences =
    text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const seen = new Set();

  const cleaned = sentences.filter((sentence) => {
    const key =
      sentence
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });

  return cleaned.join(" ");
}

function softenRepetitiveTerms(text = "") {
  if (typeof text !== "string") return text;

  return text
    .replaceAll(
      "população celular atípica população celular atípica",
      "população celular atípica",
    )
    .replaceAll(
      "População celular atípica. População celular atípica.",
      "População celular atípica.",
    )
    .replaceAll(
      "população mononuclear atípica população mononuclear atípica",
      "população mononuclear atípica",
    )
    .replaceAll(
      "requer correlação. Requer correlação.",
      "requer correlação.",
    );
}

function sanitizeNarrativeText(text = "") {
  if (typeof text !== "string") return text;

  let cleaned = text.trim();

  cleaned = softenRepetitiveTerms(cleaned);
  cleaned = cleanRepeatedSentences(cleaned);

  return cleaned;
}

function sanitizeNarrativeRepetition(result = {}) {
  if (!result || typeof result !== "object") return result;

  const cloned = {
    ...result,
    morphologyAnalysis: {
      ...(result.morphologyAnalysis || {}),
    },
    structuredReport: {
      ...(result.structuredReport || {}),
    },
    overallAssessment: {
      ...(result.overallAssessment || {}),
    },
  };

  cloned.clinicalMeaning =
    sanitizeNarrativeText(cloned.clinicalMeaning);

  cloned.interpretiveSynthesis =
    sanitizeNarrativeText(cloned.interpretiveSynthesis);

  if (typeof cloned.hematologicReasoning === "string") {
    cloned.hematologicReasoning =
      sanitizeNarrativeText(cloned.hematologicReasoning);
  }

  if (
    cloned.hematologicReasoning &&
    typeof cloned.hematologicReasoning === "object"
  ) {
    cloned.hematologicReasoning = {
      ...cloned.hematologicReasoning,
      whatISee:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatISee),
      whatItResembles:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatItResembles),
      whatICannotConfirm:
        sanitizeNarrativeText(cloned.hematologicReasoning.whatICannotConfirm),
      finalInterpretation:
        sanitizeNarrativeText(cloned.hematologicReasoning.finalInterpretation),
    };
  }

  cloned.morphologyAnalysis.overview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.overview);

  cloned.morphologyAnalysis.erythrocyteReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.erythrocyteReview);

  cloned.morphologyAnalysis.leukocyteReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.leukocyteReview);

  cloned.morphologyAnalysis.plateletReview =
    sanitizeNarrativeText(cloned.morphologyAnalysis.plateletReview);

  cloned.morphologyAnalysis.biologicalInterpretation =
    sanitizeNarrativeText(cloned.morphologyAnalysis.biologicalInterpretation);

  cloned.morphologyAnalysis.differentialDiagnosis =
    sanitizeNarrativeText(cloned.morphologyAnalysis.differentialDiagnosis);

  cloned.morphologyAnalysis.summary =
    sanitizeNarrativeText(cloned.morphologyAnalysis.summary);

  cloned.morphologyAnalysis.absentFindings =
    sanitizeNarrativeText(cloned.morphologyAnalysis.absentFindings);

  cloned.morphologyAnalysis.negativeFindings =
    Array.isArray(cloned.morphologyAnalysis.negativeFindings)
      ? [...new Set(cloned.morphologyAnalysis.negativeFindings)]
      : cloned.morphologyAnalysis.negativeFindings;

  cloned.structuredReport.conclusion =
    sanitizeNarrativeText(cloned.structuredReport.conclusion);

  cloned.structuredReport.hematologicMeaning =
    sanitizeNarrativeText(cloned.structuredReport.hematologicMeaning);

  cloned.structuredReport.recommendation =
    sanitizeNarrativeText(cloned.structuredReport.recommendation);

  cloned.overallAssessment.mainImpression =
    sanitizeNarrativeText(cloned.overallAssessment.mainImpression);

  return cloned;
}

// ============================================================================
// LIMITED FIELD FINAL LOCK
// Bloqueia falso normal em campo limitado.
// ============================================================================

function isLimitedFieldResult(result = {}) {
  return (
    result?.finalClassification === "CLASS_1_LIMITED_FIELD" ||
    result?.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
    result?.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
    result?.fieldAdequacy?.adequateForPopulationAssessment === false
  );
}

function applyLimitedFieldFinalLock(result = {}) {
  if (!result || typeof result !== "object") return result;
  if (!isLimitedFieldResult(result)) return result;

  const rawText = JSON.stringify(result || {}).toLowerCase();

  const hasParasite =
    result?.parasiteAnalysis?.suspected === true ||
    result?.findings?.parasiteSuspected === true ||
    rawText.includes("plasmodium") ||
    rawText.includes("parasita") ||
    rawText.includes("hemoparasita") ||
    rawText.includes("intraeritrocit");

  const locked = {
    ...result,
    findings: { ...(result.findings || {}) },
    morphologyAnalysis: { ...(result.morphologyAnalysis || {}) },
    whatAISees: { ...(result.whatAISees || {}) },
    patternRecognition: { ...(result.patternRecognition || {}) },
    structuredReport: { ...(result.structuredReport || {}) },
    overallAssessment: { ...(result.overallAssessment || {}) },
    erythrocyteFindings: { ...(result.erythrocyteFindings || {}) },
    leukocyteFindings: { ...(result.leukocyteFindings || {}) },
    plateletFindings: { ...(result.plateletFindings || {}) },
  };

  locked.finalClassification = "CLASS_1_LIMITED_FIELD";
  locked.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";
  locked.requiresHumanReview = true;

  if (hasParasite) {
    locked.riskLevel = "Campo limitado com achado parasitário suspeito";

    locked.findings.parasiteSuspected = true;
    locked.findings.plasmodiumSuspected = true;

    locked.parasiteAnalysis = {
      suspected: true,
      genus: "Plasmodium spp.",
      probableSpecies:
        result?.parasiteAnalysis?.probableSpecies ||
        "Espécie não definida pela imagem isolada",
      formsObserved:
        result?.parasiteAnalysis?.formsObserved?.length
          ? result.parasiteAnalysis.formsObserved
          : [
              "Trofozoíto anelar intraeritrocitário suspeito",
              "Forma delicada em anel/crescente compatível com hemoparasita",
              "Pigmento/estrutura cromática parasitária suspeita",
            ],
      interpretation:
        "Há estruturas intraeritrocitárias sugestivas de Plasmodium spp. A imagem isolada não define espécie, parasitemia ou gravidade.",
      safetyNote:
        "Confirmar por gota espessa, esfregaço seriado, teste rápido/PCR conforme protocolo e revisão microscópica profissional.",
    };

    locked.mainFinding =
      "Estruturas intraeritrocitárias sugestivas de Plasmodium spp. em campo microscópico limitado.";

    locked.primaryFinding = locked.mainFinding;

    locked.morphologyAnalysis.summary =
      "Campo microscópico limitado com estruturas intraeritrocitárias sugestivas de Plasmodium spp. Recomenda-se confirmação laboratorial e avaliação de múltiplos campos.";

    locked.morphologyAnalysis.overview =
      "Campo microscópico limitado com achado parasitário intraeritrocitário suspeito. Não afirmar normalidade global da lâmina.";

    locked.morphologyAnalysis.freeDescription =
      "Observam-se estruturas intraeritrocitárias sugestivas de hemoparasita, compatíveis com Plasmodium spp. A imagem isolada não permite definir espécie ou parasitemia.";

    locked.morphologyAnalysis.fullDescription =
      locked.morphologyAnalysis.freeDescription;

    locked.morphologyAnalysis.description =
      locked.morphologyAnalysis.freeDescription;

    locked.morphologyAnalysis.broadDescription =
      locked.morphologyAnalysis.freeDescription;

    locked.morphologyAnalysis.globalOverview =
      locked.morphologyAnalysis.overview;

    locked.morphologyAnalysis.erythrocyteReview =
      "Avaliação eritrocitária limitada ao campo enviado. Há estruturas intraeritrocitárias sugestivas de hemoparasita/Plasmodium spp.; não afirmar normocitose, normocromia ou preservação eritrocitária global.";

    locked.morphologyAnalysis.leukocyteReview =
      "Poucos leucócitos maduros visíveis. Não há evidência inequívoca de blastos ou células imaturas críticas neste campo.";

    locked.morphologyAnalysis.plateletReview =
      "Avaliação plaquetária limitada pela representatividade do campo. Não afirmar número adequado ou preservação plaquetária global.";

    locked.morphologyAnalysis.biologicalInterpretation =
      "Achado sugestivo de hemoparasita intraeritrocitário. Requer confirmação laboratorial específica e revisão microscópica profissional.";

    locked.morphologyAnalysis.differentialDiagnosis =
      "Hipótese educacional principal: Plasmodium spp. Diferenciais morfológicos/artifatuais devem ser excluídos por revisão microscópica e exames confirmatórios.";

    locked.whatAISees.globalField =
      "Campo microscópico limitado com achado parasitário suspeito.";

    locked.whatAISees.cellularity =
      "Campo não representativo para conclusão hematológica global.";

    locked.whatAISees.erythrocytes =
      "Hemácias com estruturas intraeritrocitárias sugestivas de Plasmodium spp.";

    locked.whatAISees.leukocytes =
      "Poucos leucócitos maduros visíveis; sem blastos inequívocos.";

    locked.whatAISees.platelets =
      "Avaliação plaquetária limitada.";

    locked.whatAISees.dominantFinding =
      "Estruturas intraeritrocitárias sugestivas de Plasmodium spp.";

    locked.whatAISees.unusualStructures =
      "Formas parasitárias intraeritrocitárias suspeitas.";

    locked.whatAISees.freeNarrative =
      "A imagem mostra estruturas intraeritrocitárias sugestivas de Plasmodium spp. O campo é limitado e exige confirmação laboratorial.";

    locked.patternRecognition.erythrocytePattern =
      "Achado intraeritrocitário sugestivo de hemoparasita";

    locked.patternRecognition.overallPattern =
      "Campo limitado com suspeita de Plasmodium spp.";

    locked.interpretiveSynthesis =
      "Campo microscópico limitado com estruturas intraeritrocitárias sugestivas de Plasmodium spp. A imagem isolada não permite definir espécie ou parasitemia. Recomenda-se confirmação laboratorial.";

    locked.clinicalMeaning =
      "Achado sugestivo de malária/hemoparasitose em campo limitado. Correlacionar com clínica, gota espessa, esfregaço seriado, teste rápido/PCR e revisão microscópica profissional.";

    locked.hematologicReasoning = {
      whatISee:
        "Estruturas intraeritrocitárias sugestivas de hemoparasita.",
      whatItResembles:
        "Plasmodium spp., com provável forma anelar/trofozoítica intraeritrocitária.",
      whatICannotConfirm:
        "Não é possível confirmar espécie, parasitemia, gravidade ou diagnóstico definitivo apenas pela imagem.",
      finalInterpretation:
        "Suspeita morfológica de Plasmodium spp. em campo limitado; confirmar laboratorialmente.",
    };

    locked.structuredReport.conclusion =
      locked.morphologyAnalysis.summary;

    locked.structuredReport.hematologicMeaning =
      locked.clinicalMeaning;

    locked.structuredReport.recommendation =
      "Confirmar por gota espessa, esfregaço periférico seriado, teste rápido/PCR conforme protocolo e revisão microscópica profissional.";

    locked.overallAssessment.mainImpression =
      locked.morphologyAnalysis.summary;

    locked.overallAssessment.requiresHumanReview = true;
    locked.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD_PARASITE_SUSPECTED";

    return locked;
  }

  locked.riskLevel = "Classificação morfológica indeterminada";

  locked.morphologyAnalysis.summary =
    "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas. Recomenda-se avaliação de múltiplos campos e correlação com hemograma.";

  return locked;
}

function normalizeMedicalResponse(
  data = {},
) {

  const findings =
    data.findings || {};

  const defaultAbsentFindings = `

  ✓ Blastos inequívocos não evidenciados

  ✓ Bastonetes de Auer não evidenciados

  ✓ População blástica significativa não evidenciada

  ✓ Células imaturas críticas não evidenciadas

  ✓ Esquizócitos clinicamente relevantes não evidenciados`;

  const atypicalLymphocyteSubtype =
    findings.atypicalLymphocyteSubtype ||
    data.atypicalLymphocyteSubtype ||
    "none";

    const downeyLikeCells =
      Boolean(
        findings.downeyLikeCells ||
        data.downeyLikeCells
      );

    const downeyType =
      findings.downeyType ||
      data.downeyType ||
      "none";

    const monocytoidAtypicalLymphocytes =
      Boolean(
        findings.monocytoidAtypicalLymphocytes ||
        data.monocytoidAtypicalLymphocytes ||
        atypicalLymphocyteSubtype === "monocytoid"
      );

    const lymphocytoidAtypicalLymphocytes =
      Boolean(
        findings.lymphocytoidAtypicalLymphocytes ||
        data.lymphocytoidAtypicalLymphocytes ||
        atypicalLymphocyteSubtype === "lymphocytoid"
      );

    const immunoblastoidCells =
      Boolean(
        findings.immunoblastoidCells ||
        data.immunoblastoidCells ||
        atypicalLymphocyteSubtype === "immunoblastoid"
      );

  const reactiveLymphoidPattern =
    Boolean(

      data.reactiveLymphoidPattern ||

      findings.reactiveLymphocytes ||

      findings.atypicalLymphocytes ||

      findings.largeMononuclearCells ||

      findings.plasmacytoidCells ||

      findings.plasmocytes ||

      findings.plasmablasts ||

      findings.downeyLikeCells ||

      findings.monocytoidAtypicalLymphocytes ||

      findings.immunoblastoidCells
    );

  const mononucleosisSuspicion =
    Boolean(

      data.mononucleosisSuspicion ||

      findings.downeyLikeCells ||

      findings.monocytoidAtypicalLymphocytes ||

      findings.immunoblastoidCells ||

      findings.atypicalLymphocyteSubtype ===
        "monocytoid" ||

      findings.atypicalLymphocyteSubtype ===
        "immunoblastoid"
    );

  const normalityBlocked =
    Boolean(
      data.normalityBlocked ||
      reactiveLymphoidPattern ||
      findings.monomorphicPopulation
    );

  const blockNormalReason =
    Array.isArray(data.blockNormalReason)
      ? [...data.blockNormalReason]
      : [];

  if (reactiveLymphoidPattern) {
    blockNormalReason.push(
      "Linfócitos atípicos, linfócitos reativos ou células mononucleares ativadas impedem classificação como normal."
    );
  }

  const visualEvidence =
    typeof data.visualEvidence === "object" &&
    data.visualEvidence !== null
      ? data.visualEvidence
      : (
          typeof data.rawResponse?.visualEvidence === "object" &&
          data.rawResponse.visualEvidence !== null
            ? data.rawResponse.visualEvidence
            : {}
        );

  const positiveFindings =
    Array.isArray(data.positiveFindings)
      ? [...data.positiveFindings]
      : [];

  const negativeFindingsStructured =
    Array.isArray(data.negativeFindingsStructured)
      ? [...data.negativeFindingsStructured]
      : [];

  if (
    findings?.reactiveLymphocytes === true
  ) {
    positiveFindings.push(
      "Linfócitos reativos observados"
    );
  }

  if (
    findings?.atypicalLymphocytes === true
  ) {
    positiveFindings.push(
      "Linfócitos atípicos observados"
    );
  }

  if (
    findings?.largeMononuclearCells === true
  ) {
    positiveFindings.push(
      "Células mononucleares aumentadas"
    );
  }

  if (
    findings?.plasmacytoidCells === true
  ) {
    positiveFindings.push(
      "Células plasmocitoides observadas"
    );
  }

  if (
    findings?.plasmocytes === true
  ) {
    positiveFindings.push(
      "Plasmócitos observados"
    );
  }

  if (
    findings?.plasmablasts === true
  ) {
    positiveFindings.push(
      "Plasmoblastos observados"
    );
  }

  if (
    findings?.monomorphicPopulation === true
  ) {
    positiveFindings.push(
      "População monomórfica observada"
    );
  }

  if (
    findings?.blastSuspicion !== true
  ) {
    negativeFindingsStructured.push(
      "Blastos inequívocos não evidenciados"
    );
  }

  if (
    findings?.immatureCells !== true
  ) {
    negativeFindingsStructured.push(
      "Células imaturas críticas não evidenciadas"
    );
  }

  negativeFindingsStructured.push(
    "Bastonetes de Auer não evidenciados"
  );

  negativeFindingsStructured.push(
    "Agregados plaquetários não evidenciados"
  );

  const uniquePositiveFindings =
    [...new Set(positiveFindings)]
      .filter((item) => String(item || "").trim().length > 0);

  const executiveSummary =
    typeof data.executiveSummary === "object" &&
    data.executiveSummary !== null
      ? { ...data.executiveSummary }
      : {};

  executiveSummary.mainFinding =
    executiveSummary.mainFinding ||
    data?.morphologyAnalysis?.summary ||
    data?.overallAssessment?.mainImpression ||
    "Achado principal não definido.";

  executiveSummary.riskLevel =
    executiveSummary.riskLevel ||
    data?.riskLevel ||
    data?.morphologicRiskClass ||
    "Risco não definido.";

  executiveSummary.confidence =
    executiveSummary.confidence ||
    `${data?.confidenceAnalysis?.globalConfidenceScore || 0}%`;

  executiveSummary.pattern =
    executiveSummary.pattern ||
    data?.patternRecognition?.overallPattern ||
    "Padrão morfológico não definido.";

  executiveSummary.humanReview =
    executiveSummary.humanReview ||
    (
      data?.overallAssessment?.requiresHumanReview === true ||
      data?.normalityBlocked === true
        ? "Revisão humana recomendada"
        : "Revisão humana conforme contexto clínico"
    );

  const uniqueNegativeFindings =
    [...new Set(negativeFindingsStructured)]
      .filter((item) => String(item || "").trim().length > 0);

  return {

    normalityBlocked,

    blockNormalReason:
      [...new Set(blockNormalReason)],

    morphologicRiskClass:
      mononucleosisSuspicion

        ? "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN"

        : normalityBlocked

          ? (
              data.morphologicRiskClass ===
                  "CLASS_0_NORMAL" ||
              !data.morphologicRiskClass

                ? "CLASS_2_ATYPICAL_POPULATION"

                : data.morphologicRiskClass
            )

          : (
              data.morphologicRiskClass ||
              "CLASS_0_NORMAL"
            ),

    reactiveLymphoidPattern,

    mononucleosisSuspicion,

    downeyCellSuspicion:
      Boolean(
        data.downeyCellSuspicion ||
        downeyLikeCells ||
        downeyType === "II" ||
        downeyType === "III"
      ),

    summary:
      data.summary || "",

    riskLevel:
      reactiveLymphoidPattern
        ? "Alteração morfológica linfoide reacional"
        : (data.riskLevel || "Indefinido"),

    observations:
      data.observations || "",

    alerts:
      Array.isArray(data.alerts)
        ? data.alerts
        : [],

    morphologies:
      Array.isArray(data.morphologies)
        ? data.morphologies
        : [],

    counts:
      typeof data.counts === "object" &&
      data.counts !== null
        ? data.counts
        : {},

    findings: {

      reactiveLymphocytes:
        Boolean(findings.reactiveLymphocytes),

      largeMononuclearCells:
        Boolean(findings.largeMononuclearCells),

      plasmacytoidCells:
        Boolean(findings.plasmacytoidCells),

      plasmocytes:
        Boolean(findings.plasmocytes),

      plasmablasts:
        Boolean(findings.plasmablasts),

      atypicalLymphocytes:
        Boolean(findings.atypicalLymphocytes),

      atypicalLymphocyteSubtype,

      downeyLikeCells,

      downeyType,

      monocytoidAtypicalLymphocytes,

      lymphocytoidAtypicalLymphocytes,

      immunoblastoidCells,

      monomorphicPopulation:
        Boolean(findings.monomorphicPopulation),

      immatureCells:
        Boolean(findings.immatureCells),

      blastSuspicion:
        normalizeBoolean(findings.blastSuspicion),
    },

    morphologyAnalysis: {

      visualMorphologyDescription:
        data?.morphologyAnalysis?.visualMorphologyDescription || {},

      cellMorphology:
        data?.morphologyAnalysis?.cellMorphology || {},

      populationPatternAnalysis:
        data?.morphologyAnalysis?.populationPatternAnalysis || {},

      negativeFindings:
        Array.isArray(data?.morphologyAnalysis?.negativeFindings)
          ? data.morphologyAnalysis.negativeFindings
          : [],

      overview:
        reactiveLymphoidPattern
          ? "Achado morfológico linfoide reacional/atípico identificado. A amostra não deve ser classificada como morfologia preservada."
          : (data?.morphologyAnalysis?.overview || ""),

      erythrocyteReview:
        data?.morphologyAnalysis?.erythrocyteReview || "",

      leukocyteReview:
        reactiveLymphoidPattern
          ? "Presença de padrão compatível com ativação linfoide reacional, incluindo linfócitos atípicos/reativos ou células mononucleares ativadas."
          : (data?.morphologyAnalysis?.leukocyteReview || ""),

      plateletReview:
        data?.morphologyAnalysis?.plateletReview || "",

      absentFindings:
        data?.morphologyAnalysis?.absentFindings ||
        defaultAbsentFindings,

      biologicalInterpretation:
        reactiveLymphoidPattern
          ? "O padrão pode estar associado a resposta imunológica reacional, incluindo síndrome mononucleósica, EBV, CMV ou outras viroses, sempre exigindo correlação clínica e laboratorial."
          : (data?.morphologyAnalysis?.biologicalInterpretation || ""),

      differentialDiagnosis:
        reactiveLymphoidPattern
          ? "Hipóteses educacionais: síndrome mononucleósica, mononucleose infecciosa por EBV, infecção por CMV ou resposta viral/reacional."
          : (data?.morphologyAnalysis?.differentialDiagnosis || ""),

      summary:
        reactiveLymphoidPattern
          ? "Ativação linfoide reacional / população mononuclear atípica."
          : (data?.morphologyAnalysis?.summary || ""),
    },

    educationalPearls:
      Array.isArray(data.educationalPearls)
        ? data.educationalPearls
        : [],

    heatmapRegions:
      Array.isArray(data.heatmapRegions)
        ? data.heatmapRegions
        : [],

    imageQuality:
      typeof data.imageQuality === "object" &&
      data.imageQuality !== null
        ? data.imageQuality
        : {},

    visualEvidence,

    positiveFindings:
      uniquePositiveFindings,

    negativeFindingsStructured:
      uniqueNegativeFindings,

    executiveSummary,

    whatAISees: {
      globalField:
        data?.whatAISees?.globalField ||
        data?.morphologyAnalysis?.overview ||
        '',

      cellularity:
        data?.whatAISees?.cellularity ||
        'Campo limitado para avaliação quantitativa.',

      erythrocytes:
        data?.whatAISees?.erythrocytes ||
        data?.morphologyAnalysis?.erythrocyteReview ||
        '',

      leukocytes:
        data?.whatAISees?.leukocytes ||
        data?.morphologyAnalysis?.leukocyteReview ||
        '',

      platelets:
        data?.whatAISees?.platelets ||
        data?.morphologyAnalysis?.plateletReview ||
        '',

      dominantFinding:
        data?.whatAISees?.dominantFinding ||
        data?.morphologyAnalysis?.summary ||
        '',

      unusualStructures:
        data?.whatAISees?.unusualStructures ||
        '',

      negativeFindings:
        data?.whatAISees?.negativeFindings ||
        data?.morphologyAnalysis?.absentFindings ||
        '',

      imageLimitations:
        data?.whatAISees?.imageLimitations ||
        'Análise limitada ao campo enviado.',

      freeNarrative:
        data?.whatAISees?.freeNarrative ||
        data?.morphologyAnalysis?.summary ||
        '',

      positiveFindings:
        uniquePositiveFindings || [],

      negativeFindingsStructured:
        uniqueNegativeFindings || [],
    },

    patternRecognition: {

      erythrocytePattern:
        data?.patternRecognition?.erythrocytePattern || "",

      leukocytePattern:
        reactiveLymphoidPattern
          ? "Reactive lymphoid activation"
          : (data?.patternRecognition?.leukocytePattern || ""),

      plateletPattern:
        data?.patternRecognition?.plateletPattern || "",

      artifactPattern:
        data?.patternRecognition?.artifactPattern || "",

      overallPattern:
        reactiveLymphoidPattern
          ? "Reactive lymphoid activation / atypical mononuclear population"
          : (data?.patternRecognition?.overallPattern || ""),
    },

    interpretiveSynthesis:
      reactiveLymphoidPattern
        ? "Há achados morfológicos que impedem a classificação como normal. O padrão linfoide observado sugere ativação imunológica reacional, com hipótese educacional de síndrome mononucleósica, dependente de correlação clínica, hemograma e sorologias."
        : (data?.interpretiveSynthesis || ""),

    clinicalMeaning:
      reactiveLymphoidPattern
        ? "Achado educacionalmente relevante: padrão linfoide reacional/atípico."
        : (data?.clinicalMeaning || ""),

    hematologicReasoning:
      data?.hematologicReasoning || "",

    educationalImpact:
      data?.educationalImpact || "",

    erythrocyteFindings:
      typeof data.erythrocyteFindings === "object" &&
      data.erythrocyteFindings !== null
        ? data.erythrocyteFindings
        : {},

    leukocyteFindings:
      typeof data.leukocyteFindings === "object" &&
      data.leukocyteFindings !== null
        ? data.leukocyteFindings
        : {},

    plateletFindings:
      typeof data.plateletFindings === "object" &&
      data.plateletFindings !== null
        ? data.plateletFindings
        : {},

    blastSuspicion:
      typeof data.blastSuspicion === "object" &&
      data.blastSuspicion !== null
        ? data.blastSuspicion
        : {},

    overallAssessment:
      typeof data.overallAssessment === "object" &&
      data.overallAssessment !== null
        ? {
            ...data.overallAssessment,
            requiresHumanReview:
              normalityBlocked ||
              data.overallAssessment?.requiresHumanReview === true,

            riskCategory:
              reactiveLymphoidPattern
                ? "CLASS_2_ATYPICAL_POPULATION"
                : data.overallAssessment?.riskCategory,
          }
        : {
            requiresHumanReview: normalityBlocked,
            riskCategory:
              normalityBlocked
                ? "CLASS_2_ATYPICAL_POPULATION"
                : "CLASS_0_NORMAL",
          },

    structuredReport:
      typeof data.structuredReport === "object" &&
      data.structuredReport !== null
        ? data.structuredReport
        : {},

    differentialDiagnosis:
      reactiveLymphoidPattern
        ? [
            "Síndrome mononucleósica",
            "Mononucleose infecciosa por EBV",
            "Infecção por CMV",
            "Resposta imunológica reacional",
            ...(
              Array.isArray(data.differentialDiagnosis)
                ? data.differentialDiagnosis
                : []
            ),
          ]
        : (
            Array.isArray(data.differentialDiagnosis)
              ? data.differentialDiagnosis
              : []
          ),

    criticalFlags:
      Array.isArray(data.criticalFlags)
        ? data.criticalFlags
        : [],

    analysisSource:
      data.analysisSource || "ai_visual",

    manualCounts:
      typeof data.manualCounts === "object" &&
      data.manualCounts !== null
        ? data.manualCounts
        : {},

    aiDetectedCounts:
      typeof data.aiDetectedCounts === "object" &&
      data.aiDetectedCounts !== null
        ? data.aiDetectedCounts
        : {},

    hybridValidation:
      typeof data.hybridValidation === "object" &&
      data.hybridValidation !== null
        ? data.hybridValidation
        : {},

    rawResponse: data,
  };
}
function auth(
  req,
  res,
  next,
) {

  try {

    const token =
      req.headers.authorization
        ?.replace(
          "Bearer ",
          "",
        );

    if (

      !token ||

      token.trim() !==
        API_TOKEN.trim()

    ) {

      return res.status(401).json({

        success: false,

        error:
          "Token inválido.",
      });
    }

    next();

  } catch (error) {

    return res.status(500).json({

      success: false,

      error:
        "Erro interno autenticação.",
    });
  }
}

// ============================================================================
// USER
// ============================================================================

function getUser(req) {

  const userId =
    req.headers["x-user-id"] ||
    "anonymous_device";

  if (!users.has(userId)) {

    users.set(userId, {

      totalUses: 0,

      plan: "hospital",

      educationalOnly: true,
    });
  }

  return {

    userId,

    data:
      users.get(userId),
  };
}

// ============================================================================
// TEXT NORMALIZER
// ============================================================================

function normalizeSemanticText(
  value = "",
) {

  return String(value)

    .normalize("NFD")

    .replace(
      /[\u0300-\u036f]/g,
      "",
    )

    .replace(
      /[^a-zA-Z0-9\s]/g,
      " ",
    )

    .replace(
      /\s+/g,
      " ",
    )

    .toLowerCase()

    .trim();
}

// ============================================================================
// ANALYSIS SOURCE
// ============================================================================

function normalizeAnalysisSource(
  source = "",
) {

  const normalized =
    String(source)
      .toLowerCase()
      .trim();

  if (
    normalized === "manual"
  ) {

    return "manual";
  }

  if (
    normalized === "hybrid"
  ) {

    return "hybrid";
  }

  return "ai_visual";
}

function buildSafeManualMetadata({

  analysisSource,

  manualCounts = {},
}) {

  const hasManualData =
    Object.keys(
      manualCounts,
    ).length > 0;

  return {

    analysisSource,

    manualMode:
      analysisSource ===
      "manual",

    hybridMode:
      analysisSource ===
      "hybrid",

    aiVisualMode:
      analysisSource ===
      "ai_visual",

    hasManualData,
  };
}

// ============================================================================
// SEMANTIC EXTRACTION
// ============================================================================

function buildSemanticText(
  parsed = {},
) {

  const blocks = [

    parsed.summary,

    parsed.observations,

    parsed.riskLevel,

    parsed.morphologicInterpretation,

    parsed.hematologicCorrelation,

    parsed.educationalConclusion,

    parsed.plainTextReport,

    parsed.mainImpression,

    parsed.morphologySummary,

    parsed.structuredReport
      ?.morphologySummary,

    parsed.structuredReport
      ?.educationalConclusion,

    parsed.structuredReport
      ?.plainTextReport,

    parsed.overallAssessment
      ?.mainImpression,

    parsed.overallAssessment
      ?.recommendedCorrelation,

    parsed.imageQuality
      ?.limitations,

    parsed.imageQuality
      ?.artifacts,

    parsed.erythrocyteFindings
      ?.summary,

    parsed.erythrocyteFindings
      ?.findings,

    parsed.erythrocyteFindings
      ?.suspectedPatterns,

    parsed.leukocyteFindings
      ?.summary,

    parsed.leukocyteFindings
      ?.findings,

    parsed.leukocyteFindings
      ?.leftShift,

    parsed.leukocyteFindings
      ?.toxicChanges,

    parsed.leukocyteFindings
      ?.dysplasiaSuspicion,

    parsed.blastSuspicion
      ?.morphologicReasons,

    parsed.blastSuspicion
      ?.againstBlast,

    parsed.plateletFindings
      ?.summary,

    parsed.plateletFindings
      ?.findings,

    parsed.differentialDiagnosis,

    parsed.criticalFlags,

    parsed.educationalPearls,

    parsed.morphologies,

    parsed.alerts,

    parsed.heatmapRegions,

    parsed.rawResponseText,

    parsed.analise,
  ];

  return normalizeSemanticText(

    blocks

      .flat(Infinity)

      .filter(Boolean)

      .map((item) => {

        if (
          typeof item ===
          "string"
        ) {

          return item;
        }

        return JSON.stringify(
          item,
        );
      })

      .join(" "),
  );
}

// ============================================================================
// HEMATOLOGY PIPELINE PROMPT V7
// CELLCOUNT ELITE HOSPITAL AI
// ============================================================================

const hospitalPrompt = `

VOCÊ É UMA IA HEMATOLÓGICA HOSPITALAR DE ALTA COMPLEXIDADE.

ESPECIALIZAÇÕES:
- hematologia clínica
- hematopatologia
- morfologia hematológica
- citologia hematológica
- microscopia digital
- sangue periférico
- medula óssea
- revisão microscópica educacional
- análise morfológica avançada

MISSÃO:
Executar análise hematológica EDUCACIONAL altamente segura, estruturada e semelhante à revisão microscópica hospitalar real.

====================================================================
REGRAS ABSOLUTAS
====================================================================

NUNCA:

- emitir diagnóstico definitivo
- confirmar leucemia
- confirmar malignidade
- afirmar neoplasia hematológica
- afirmar blastose verdadeira
- substituir hematologista
- inventar células
- inferir estruturas não visualizadas
- ignorar limitações técnicas
- extrapolar achados
- gerar linguagem conclusiva
- utilizar linguagem alarmista
- interpretar contagem manual como evidência visual

PROIBIDO USAR:

- “diagnóstico de”
- “confirmado”
- “compatível definitivamente”
- “leucemia”
- “neoplasia confirmada”
- “maligno”
- “blastos confirmados”

UTILIZAR SOMENTE:

- suspeita morfológica
- hipótese educacional
- requer correlação
- sugestivo de
- achado não conclusivo
- possível presença
- baixa evidência visual
- moderada evidência visual
- revisão microscópi> start
                    > node server.js
                    🔥 RBC ENGINE V5 LOADED
                    🧬 LEUKOCYTE ENGINE V5 LOADED
                    ◇ injected env (0) from .env // tip: ⌁ auth for agents [www.vestauth.com]
                    🔑 OpenAI API: CONFIGURADA
                    🧠 Modelo: gpt-4o
                    🔥 CELLCOUNT ELITE HOSPITAL rodando na porta 10000
                    🧠 Modelo: gpt-4o
                    🩸 IA hematológica online
                    🚀 PIPELINE ENTERPRISE V6 SAFE HYBRID ONLINE
                    ==> Your service is live 🎉
                    ==>
                    ==> ///////////////////////////////////////////////////////////
                    ==>
                    ==> Available at your primary URL https://api.rodrigueslucio.com + 1 more domain
                    ==>
                    ==> ///////////////////////////////////////////////////////////
                    ==> Deploying...
                    ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
                    ==> Running 'npm start'
                    > start
                    > node server.js
                    🔥 RBC ENGINE V5 LOADED
                    🧬 LEUKOCYTE ENGINE V5 LOADED
                    ◇ injected env (0) from .env // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
                    🔑 OpenAI API: CONFIGURADA
                    🧠 Modelo: gpt-4o
                    🔥 CELLCOUNT ELITE HOSPITAL rodando na porta 10000
                    🧠 Modelo: gpt-4o
                    🩸 IA hematológica online
                    🚀 PIPELINE ENTERPRISE V6 SAFE HYBRID ONLINE
                    ==> Your service is live 🎉
                    ==>
                    ==> ///////////////////////////////////////////////////////////
                    ==>
                    ==> Available at your primary URL https://api.rodrigueslucio.com + 1 more domain
                    ==>
                    ==> ///////////////////////////////////////////////////////////
                    🔬 1 imagens recebidas
                    🧠 SOURCE: ai_visual
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] IMAGE ENHANCEMENT TURBO - 1213ms
                    ================================
                    RAW GPT RESPONSE
                    {
                      "imageQuality": {
                        "focus": "Adequado",
                        "nitidez": "Boa",
                        "coloração": "Adequada",
                        "iluminação": "Uniforme",
                        "artefatos": "Mínimos",
                        "compressão": "Baixa",
                        "sobreposiçãoCelular": "Mínima",
                        "resolução": "Alta",
                        "distorções": "Nenhuma",
                        "areasInadequadas": "Nenhuma"
                      },
                      "visualExtraction": {
                        "neutrófilos": "Presentes",
                        "linfócitos": "Presentes",
                        "monócitos": "Não observados",
                        "eosinófilos": "Não observados",
                        "basófilos": "Não observados",
                        "blastosSuspeitos": "Não observados",
                        "célulasImaturas": "Não observadas",
                        "eritroblastos": "Não observados",
                        "plaquetas": "Presentes",
                        "agregados": "Não observados",
                        "artefatos": "Mínimos"
                      },
                      "normalityBlocked": false,
                      "blockNormalReason": [],
                      "morphologicRiskClass": "CLASS_0_NORMAL",
                      "findings": {
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração e foco adequados. Observa-se uma distribuição celular homogênea com presença de linfócitos e neutrófilos. Não há sobreposição significativa de células.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose evidente.",
                        "leukocyteReview": "Presença de linfócitos e neutrófilos maduros. Não há evidência de células imaturas ou atípicas.",
                        "plateletReview": "Plaquetas presentes em quantidade adequada, sem agregação ou gigantismo.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "A morfologia observada é compatível com um esfregaço de sangue periférico normal, sem evidências de alterações patológicas significativas.",
                        "differentialDiagnosis": "1. Esfregaço normal; 2. Alterações reacionais mínimas; 3. Artefatos de preparação.",
                        "summary": "A análise morfológica não revela alterações significativas, com presença de células sanguíneas maduras e normais."
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico e normocrômico",
                        "leukocytePattern": "Presença de linfócitos e neutrófilos maduros",
                        "plateletPattern": "Plaquetas em quantidade normal",
                        "artifactPattern": "Artefatos mínimos",
                        "overallPattern": "Padrão hematológico normal"
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                      "clinicalMeaning": "Os achados observados são sugestivos de um estado hematológico normal, sem evidências de alterações patológicas significativas. A presença de linfócitos e neutrófilos maduros, juntamente com eritrócitos normocíticos e normocrômicos, indica uma morfologia celular dentro dos padrões esperados. É importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A análise morfológica do esfregaço sanguíneo demonstra uma população celular madura e normal, sem evidências de alterações reacionais ou patológicas. A presença de linfócitos e neutrófilos maduros sugere uma resposta imunológica adequada, enquanto a morfologia eritrocitária normocítica e normocrômica indica uma produção eritropoiética normal. A ausência de células imaturas ou atípicas reforça a interpretação de normalidade. No entanto, é essencial considerar a correlação com dados clínicos e laboratoriais adicionais para uma avaliação abrangente.",
                      "educationalImpact": "Este caso ilustra a importância da avaliação morfológica detalhada em hematologia, destacando a necessidade de uma análise cuidadosa para identificar padrões normais e descartar alterações patológicas. A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa e para a tomada de decisões clínicas informadas.",
                      "visualEvidence": {
                        "visualEvidenceScore": 85,
                        "evidenceLevel": "alta evidência visual",
                        "morphologyConfidence": "alta",
                        "imageReliability": "alta",
                        "artifactInterference": "mínima"
                      },
                      "confidenceAnalysis": {
                        "coerênciaHematológica": "alta",
                        "coerênciaVisual": "alta",
                        "coerênciaMorfológica": "alta",
                        "coerênciaDeConfiança": "alta"
                      },
                      "safetyValidation": {
                        "contradiçõesInternas": "nenhuma",
                        "exageroDiagnóstico": "nenhum",
                        "inferênciasIndevidas": "nenhuma",
                        "limitaçõesTécnicas": "nenhuma",
                        "qualidadeInsuficiente": "nenhuma",
                        "inconsistênciaMorfológica": "nenhuma"
                      },
                      "consensusAnalysis": {
                        "coerênciaHematológica": "alta",
                        "coerênciaVisual": "alta",
                        "coerênciaMorfológica": "alta",
                        "coerênciaDeConfiança": "alta"
                      },
                      "clinicalCorrelation": {
                        "necessidadeDeRevisão": "não necessária",
                        "correlaçãoClínica": "recomendada para confirmação",
                        "examesComplementares": "hemograma completo"
                      },
                      "erythrocyteFindings": {
                        "normocitose": true,
                        "normocromia": true,
                        "anisocitose": false,
                        "poiquilocitose": false
                      },
                      "leukocyteFindings": {
                        "linfócitosMaduros": true,
                        "neutrófilosMaduros": true,
                        "célulasImaturas": false,
                        "célulasAtípicas": false
                      },
                      "plateletFindings": {
                        "quantidadeNormal": true,
                        "agregação": false,
                        "gigantismo": false
                      },
                      "blastSuspicion": {
                        "suspeitaDeBlastos": false
                      },
                      "overallAssessment": {
                        "mainImpression": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável."
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com padrão normal, presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas adequadas.",
                        "interpretacaoEducacional": "Os achados são compatíveis com um estado hematológico normal. A presença de células maduras e a ausência de alterações patológicas significativas indicam uma morfologia celular dentro dos padrões esperados.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "criticalFlags": [],
                      "educationalPearls": [
                        "A avaliação morfológica detalhada é essencial para identificar padrões normais e descartar alterações patológicas.",
                        "A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa."
                      ],
                      "limitations": [
                        "Análise baseada apenas nas imagens enviadas.",
                        "Necessidade de hemograma completo para avaliação abrangente."
                      ],
                      "recommendedCorrelation": [
                        "Hemograma completo",
                        "Revisão microscópica profissional quando indicada"
                      ],
                      "heatmapRegions": []
                    }
                    ================================
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] OPENAI TURBO ANALYSIS - 27320ms
                    ================================
                    NORMALIZED RESPONSE
                    FIELD ADEQUACY
                    {
                      "visibleLeukocytes": 5,
                      "singleCellConcern": false,
                      "adequateForLeukocyteAnalysis": true,
                      "adequateForBlastScreening": true,
                      "adequateForPopulationAssessment": false
                    }
                    {
                      "normalityBlocked": false,
                      "blockNormalReason": [],
                      "morphologicRiskClass": "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
                      "reactiveLymphoidPattern": false,
                      "mononucleosisSuspicion": false,
                      "downeyCellSuspicion": false,
                      "summary": "",
                      "riskLevel": "Achado celular isolado",
                      "observations": "",
                      "alerts": [],
                      "morphologies": [],
                      "counts": {},
                      "findings": {
                        "reactiveLymphocytes": false,
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração e foco adequados. Observa-se uma distribuição celular homogênea com presença de linfócitos e neutrófilos. Não há sobreposição significativa de células.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose evidente.",
                        "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                        "plateletReview": "Plaquetas presentes em quantidade adequada, sem agregação ou gigantismo.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "A morfologia observada é compatível com um esfregaço de sangue periférico normal, sem evidências de alterações patológicas significativas.",
                        "differentialDiagnosis": "1. Esfregaço normal; 2. Alterações reacionais mínimas; 3. Artefatos de preparação.",
                        "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                      },
                      "educationalPearls": [
                        "A avaliação morfológica detalhada é essencial para identificar padrões normais e descartar alterações patológicas.",
                        "A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa."
                      ],
                      "heatmapRegions": [],
                      "imageQuality": {
                        "focus": "Adequado",
                        "nitidez": "Boa",
                        "coloração": "Adequada",
                        "iluminação": "Uniforme",
                        "artefatos": "Mínimos",
                        "compressão": "Baixa",
                        "sobreposiçãoCelular": "Mínima",
                        "resolução": "Alta",
                        "distorções": "Nenhuma",
                        "areasInadequadas": "Nenhuma"
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico e normocrômico",
                        "leukocytePattern": "Achado mononuclear isolado",
                        "plateletPattern": "Plaquetas em quantidade normal",
                        "artifactPattern": "Artefatos mínimos",
                        "overallPattern": "Campo limitado para caracterização populacional"
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                      "clinicalMeaning": "Os achados observados são sugestivos de um estado hematológico normal, sem evidências de alterações patológicas significativas. A presença de linfócitos e neutrófilos maduros, juntamente com eritrócitos normocíticos e normocrômicos, indica uma morfologia celular dentro dos padrões esperados. É importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A análise morfológica do esfregaço sanguíneo demonstra uma população celular madura e normal, sem evidências de alterações reacionais ou patológicas. A presença de linfócitos e neutrófilos maduros sugere uma resposta imunológica adequada, enquanto a morfologia eritrocitária normocítica e normocrômica indica uma produção eritropoiética normal. A ausência de células imaturas ou atípicas reforça a interpretação de normalidade. No entanto, é essencial considerar a correlação com dados clínicos e laboratoriais adicionais para uma avaliação abrangente.",
                      "educationalImpact": "Este caso ilustra a importância da avaliação morfológica detalhada em hematologia, destacando a necessidade de uma análise cuidadosa para identificar padrões normais e descartar alterações patológicas. A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa e para a tomada de decisões clínicas informadas.",
                      "erythrocyteFindings": {
                        "normocitose": true,
                        "normocromia": true,
                        "anisocitose": false,
                        "poiquilocitose": false
                      },
                      "leukocyteFindings": {
                        "linfócitosMaduros": true,
                        "neutrófilosMaduros": true,
                        "célulasImaturas": false,
                        "célulasAtípicas": false
                      },
                      "plateletFindings": {
                        "quantidadeNormal": true,
                        "agregação": false,
                        "gigantismo": false
                      },
                      "blastSuspicion": {
                        "suspeitaDeBlastos": false
                      },
                      "overallAssessment": {
                        "mainImpression": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                        "requiresHumanReview": false
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com padrão normal, presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas adequadas.",
                        "interpretacaoEducacional": "Os achados são compatíveis com um estado hematológico normal. A presença de células maduras e a ausência de alterações patológicas significativas indicam uma morfologia celular dentro dos padrões esperados.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "differentialDiagnosis": [],
                      "criticalFlags": [],
                      "analysisSource": "ai_visual",
                      "manualCounts": {},
                      "aiDetectedCounts": {},
                      "hybridValidation": {},
                      "rawResponse": {
                        "imageQuality": {
                          "focus": "Adequado",
                          "nitidez": "Boa",
                          "coloração": "Adequada",
                          "iluminação": "Uniforme",
                          "artefatos": "Mínimos",
                          "compressão": "Baixa",
                          "sobreposiçãoCelular": "Mínima",
                          "resolução": "Alta",
                          "distorções": "Nenhuma",
                          "areasInadequadas": "Nenhuma"
                        },
                        "visualExtraction": {
                          "neutrófilos": "Presentes",
                          "linfócitos": "Presentes",
                          "monócitos": "Não observados",
                          "eosinófilos": "Não observados",
                          "basófilos": "Não observados",
                          "blastosSuspeitos": "Não observados",
                          "célulasImaturas": "Não observadas",
                          "eritroblastos": "Não observados",
                          "plaquetas": "Presentes",
                          "agregados": "Não observados",
                          "artefatos": "Mínimos"
                        },
                        "normalityBlocked": false,
                        "blockNormalReason": [],
                        "morphologicRiskClass": "CLASS_0_NORMAL",
                        "findings": {
                          "largeMononuclearCells": false,
                          "plasmacytoidCells": false,
                          "plasmocytes": false,
                          "plasmablasts": false,
                          "atypicalLymphocytes": false,
                          "atypicalLymphocyteSubtype": "none",
                          "downeyLikeCells": false,
                          "downeyType": "none",
                          "monocytoidAtypicalLymphocytes": false,
                          "lymphocytoidAtypicalLymphocytes": false,
                          "immunoblastoidCells": false,
                          "monomorphicPopulation": false,
                          "immatureCells": false,
                          "blastSuspicion": false
                        },
                        "morphologyAnalysis": {
                          "overview": "A imagem apresenta boa qualidade com coloração e foco adequados. Observa-se uma distribuição celular homogênea com presença de linfócitos e neutrófilos. Não há sobreposição significativa de células.",
                          "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose evidente.",
                          "leukocyteReview": "Presença de linfócitos e neutrófilos maduros. Não há evidência de células imaturas ou atípicas.",
                          "plateletReview": "Plaquetas presentes em quantidade adequada, sem agregação ou gigantismo.",
                          "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                          "biologicalInterpretation": "A morfologia observada é compatível com um esfregaço de sangue periférico normal, sem evidências de alterações patológicas significativas.",
                          "differentialDiagnosis": "1. Esfregaço normal; 2. Alterações reacionais mínimas; 3. Artefatos de preparação.",
                          "summary": "A análise morfológica não revela alterações significativas, com presença de células sanguíneas maduras e normais."
                        },
                        "patternRecognition": {
                          "erythrocytePattern": "Normocítico e normocrômico",
                          "leukocytePattern": "Presença de linfócitos e neutrófilos maduros",
                          "plateletPattern": "Plaquetas em quantidade normal",
                          "artifactPattern": "Artefatos mínimos",
                          "overallPattern": "Padrão hematológico normal"
                        },
                        "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                        "clinicalMeaning": "Os achados observados são sugestivos de um estado hematológico normal, sem evidências de alterações patológicas significativas. A presença de linfócitos e neutrófilos maduros, juntamente com eritrócitos normocíticos e normocrômicos, indica uma morfologia celular dentro dos padrões esperados. É importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                        "hematologicReasoning": "A análise morfológica do esfregaço sanguíneo demonstra uma população celular madura e normal, sem evidências de alterações reacionais ou patológicas. A presença de linfócitos e neutrófilos maduros sugere uma resposta imunológica adequada, enquanto a morfologia eritrocitária normocítica e normocrômica indica uma produção eritropoiética normal. A ausência de células imaturas ou atípicas reforça a interpretação de normalidade. No entanto, é essencial considerar a correlação com dados clínicos e laboratoriais adicionais para uma avaliação abrangente.",
                        "educationalImpact": "Este caso ilustra a importância da avaliação morfológica detalhada em hematologia, destacando a necessidade de uma análise cuidadosa para identificar padrões normais e descartar alterações patológicas. A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa e para a tomada de decisões clínicas informadas.",
                        "visualEvidence": {
                          "visualEvidenceScore": 85,
                          "evidenceLevel": "alta evidência visual",
                          "morphologyConfidence": "alta",
                          "imageReliability": "alta",
                          "artifactInterference": "mínima"
                        },
                        "confidenceAnalysis": {
                          "coerênciaHematológica": "alta",
                          "coerênciaVisual": "alta",
                          "coerênciaMorfológica": "alta",
                          "coerênciaDeConfiança": "alta"
                        },
                        "safetyValidation": {
                          "contradiçõesInternas": "nenhuma",
                          "exageroDiagnóstico": "nenhum",
                          "inferênciasIndevidas": "nenhuma",
                          "limitaçõesTécnicas": "nenhuma",
                          "qualidadeInsuficiente": "nenhuma",
                          "inconsistênciaMorfológica": "nenhuma"
                        },
                        "consensusAnalysis": {
                          "coerênciaHematológica": "alta",
                          "coerênciaVisual": "alta",
                          "coerênciaMorfológica": "alta",
                          "coerênciaDeConfiança": "alta"
                        },
                        "clinicalCorrelation": {
                          "necessidadeDeRevisão": "não necessária",
                          "correlaçãoClínica": "recomendada para confirmação",
                          "examesComplementares": "hemograma completo"
                        },
                        "erythrocyteFindings": {
                          "normocitose": true,
                          "normocromia": true,
                          "anisocitose": false,
                          "poiquilocitose": false
                        },
                        "leukocyteFindings": {
                          "linfócitosMaduros": true,
                          "neutrófilosMaduros": true,
                          "célulasImaturas": false,
                          "célulasAtípicas": false
                        },
                        "plateletFindings": {
                          "quantidadeNormal": true,
                          "agregação": false,
                          "gigantismo": false
                        },
                        "blastSuspicion": {
                          "suspeitaDeBlastos": false
                        },
                        "overallAssessment": {
                          "mainImpression": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável."
                        },
                        "structuredReport": {
                          "resumoMorfologico": "Esfregaço sanguíneo com padrão normal, presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas adequadas.",
                          "interpretacaoEducacional": "Os achados são compatíveis com um estado hematológico normal. A presença de células maduras e a ausência de alterações patológicas significativas indicam uma morfologia celular dentro dos padrões esperados.",
                          "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                        },
                        "criticalFlags": [],
                        "educationalPearls": [
                          "A avaliação morfológica detalhada é essencial para identificar padrões normais e descartar alterações patológicas.",
                          "A correlação com exames complementares, como hemograma completo, é fundamental para uma interpretação precisa."
                        ],
                        "limitations": [
                          "Análise baseada apenas nas imagens enviadas.",
                          "Necessidade de hemograma completo para avaliação abrangente."
                        ],
                        "recommendedCorrelation": [
                          "Hemograma completo",
                          "Revisão microscópica profissional quando indicada"
                        ],
                        "heatmapRegions": [],
                        "analysisSource": "ai_visual",
                        "manualCounts": {},
                        "manualMetadata": {
                          "analysisSource": "ai_visual",
                          "manualMode": false,
                          "hybridMode": false,
                          "aiVisualMode": true,
                          "hasManualData": false
                        }
                      },
                      "fieldAdequacy": {
                        "visibleLeukocytes": 5,
                        "singleCellConcern": false,
                        "adequateForLeukocyteAnalysis": true,
                        "adequateForBlastScreening": true,
                        "adequateForPopulationAssessment": false
                      }
                    }
                    ================================
                    MORPHOLOGY ANALYSIS
                    {
                      "overview": "A imagem apresenta boa qualidade com coloração e foco adequados. Observa-se uma distribuição celular homogênea com presença de linfócitos e neutrófilos. Não há sobreposição significativa de células.",
                      "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose evidente.",
                      "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                      "plateletReview": "Plaquetas presentes em quantidade adequada, sem agregação ou gigantismo.",
                      "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                      "biologicalInterpretation": "A morfologia observada é compatível com um esfregaço de sangue periférico normal, sem evidências de alterações patológicas significativas.",
                      "differentialDiagnosis": "1. Esfregaço normal; 2. Alterações reacionais mínimas; 3. Artefatos de preparação.",
                      "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                    }
                    ================================
                    🔥 NORMALIZED RESPONSE:
                    {
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração e foco adequados. Observa-se uma distribuição celular homogênea com presença de linfócitos e neutrófilos. Não há sobreposição significativa de células.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose evidente.",
                        "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                        "plateletReview": "Plaquetas presentes em quantidade adequada, sem agregação ou gigantismo.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "A morfologia observada é compatível com um esfregaço de sangue periférico normal, sem evidências de alterações patológicas significativas.",
                        "differentialDiagnosis": "1. Esfregaço normal; 2. Alterações reacionais mínimas; 3. Artefatos de preparação.",
                        "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico e normocrômico",
                        "leukocytePattern": "Achado mononuclear isolado",
                        "plateletPattern": "Plaquetas em quantidade normal",
                        "artifactPattern": "Artefatos mínimos",
                        "overallPattern": "Campo limitado para caracterização populacional"
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com padrão normal, presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas adequadas.",
                        "interpretacaoEducacional": "Os achados são compatíveis com um estado hematológico normal. A presença de células maduras e a ausência de alterações patológicas significativas indicam uma morfologia celular dentro dos padrões esperados.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "overallAssessment": {
                        "mainImpression": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                        "requiresHumanReview": false
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão normal, com presença de linfócitos e neutrófilos maduros, eritrócitos normocíticos e normocrômicos, e plaquetas em quantidade adequada. Não há evidência de células imaturas ou atípicas, e a qualidade da imagem é boa, permitindo uma avaliação confiável.",
                      "clinicalMeaning": "Os achados observados são sugestivos de um estado hematológico normal, sem evidências de alterações patológicas significativas. A presença de linfócitos e neutrófilos maduros, juntamente com eritrócitos normocíticos e normocrômicos, indica uma morfologia celular dentro dos padrões esperados. É importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A análise morfológica do esfregaço sanguíneo demonstra uma população celular madura e normal, sem evidências de alterações reacionais ou patológicas. A presença de linfócitos e neutrófilos maduros sugere uma resposta imunológica adequada, enquanto a morfologia eritrocitária normocítica e normocrômica indica uma produção eritropoiética normal. A ausência de células imaturas ou atípicas reforça a interpretação de normalidade. No entanto, é essencial considerar a correlação com dados clínicos e laboratoriais adicionais para uma avaliação abrangente."
                    }
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] HEMATOLOGY ENGINES - 2ms
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] SAFETY ENGINE - 5ms
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] CONSENSUS ENGINE - 0ms
                    CONFIDENCE DEBUG {
                      "visualEvidenceScore": 0,
                      "diagnosticReliability": 0,
                      "morphologyCoherence": 0,
                      "artifactProbability": 0,
                      "falsePositiveRisk": 0,
                      "safeDiagnosticGate": false,
                      "globalConfidenceScore": 23,
                      "hematologicRisk": {
                        "level": "low",
                        "score": 7,
                        "label": "BAIXO RISCO"
                      }
                    }
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] CONFIDENCE ENGINE - 3ms
                    🧠 [bdd4b1ef-f653-437d-8f4b-793d5d7c9741] TOTAL PIPELINE TURBO - 28545ms
                    ================================
                    FINAL VALIDATED RESULT
                    {
                      "normalityBlocked": false,
                      "morphologicRiskClass": "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
                      "riskLevel": "Achado celular isolado",
                      "requiresHumanReview": false,
                      "findings": {
                        "reactiveLymphocytes": false,
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "blockNormalReason": [],
                      "confidenceAnalysis": {
                        "globalConfidenceScore": 23,
                        "hematologicRisk": {
                          "level": "low",
                          "score": 7,
                          "label": "BAIXO RISCO"
                        },
                        "microscopyQuality": {
                          "score": 55,
                          "classification": "Moderada"
                        },
                        "confidenceMatrix": {
                          "blastConfidence": 0,
                          "schistocyteConfidence": 8,
                          "erythrocyteConfidence": 42,
                          "plateletConfidence": 41,
                          "inflammatoryPatternConfidence": 27,
                          "dysplasiaConfidence": 7,
                          "diagnosticCoherenceConfidence": 15
                        },
                        "confidenceHierarchy": {
                          "cellLevel": 60,
                          "morphologyLevel": 16,
                          "diagnosticLevel": 15,
                          "global": 23
                        },
                        "calibration": {
                          "version": "V4_ENTERPRISE_SAFETY_AWARE",
                          "strategy": "safety_weighted_multiengine_confidence",
                          "safetyAware": true,
                          "visualEvidenceAware": true,
                          "yoloFusionAware": true,
                          "overcallingSuppression": true,
                          "undercallingProtection": true,
                          "semanticExtractionAware": true
                        },
                        "safetySignals": {
                          "visualEvidenceScore": 0,
                          "diagnosticReliability": 0,
                          "morphologyCoherence": 0,
                          "artifactProbability": 0,
                          "falsePositiveRisk": 0,
                          "safeDiagnosticGate": false
                        },
                        "summary": "Análise hematológica processada com confiança hierárquica multi-engine V4. Baixa sustentação para suspeita blástica. Confiança global: 23%. Classificação: BAIXO RISCO."
                      }
                    }
                    ================================
                    🔬 1 imagens recebidas
                    🧠 SOURCE: ai_visual
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] IMAGE ENHANCEMENT TURBO - 814ms
                    ================================
                    RAW GPT RESPONSE
                    {
                      "imageQuality": {
                        "focus": "Adequado",
                        "nitidez": "Boa",
                        "coloração": "Uniforme",
                        "iluminação": "Adequada",
                        "artefatos": "Mínimos",
                        "compressão": "Baixa",
                        "sobreposiçãoCelular": "Mínima",
                        "resolução": "Alta",
                        "distorções": "Nenhuma",
                        "areasInadequadas": "Nenhuma"
                      },
                      "visualExtraction": {
                        "neutrófilos": "Presentes",
                        "linfócitos": "Presentes",
                        "monócitos": "Não observados",
                        "eosinófilos": "Não observados",
                        "basófilos": "Não observados",
                        "blastosSuspeitos": "Não observados",
                        "célulasImaturas": "Não observadas",
                        "eritroblastos": "Não observados",
                        "plaquetas": "Presentes",
                        "agregados": "Não observados",
                        "artefatos": "Mínimos"
                      },
                      "normalityBlocked": false,
                      "blockNormalReason": [],
                      "morphologicRiskClass": "CLASS_0_NORMAL",
                      "findings": {
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração uniforme e nitidez adequada. A celularidade é composta principalmente por eritrócitos e alguns leucócitos, com destaque para um linfócito reativo.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose significativa.",
                        "leukocyteReview": "Presença de linfócitos normais e um linfócito reativo, sem evidência de células imaturas ou blastos.",
                        "plateletReview": "Plaquetas presentes em número adequado, sem alterações morfológicas significativas.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "Os achados são compatíveis com um esfregaço sanguíneo normal, com a presença de um linfócito reativo que pode estar associado a uma resposta imunológica.",
                        "differentialDiagnosis": "1. Resposta imunológica reativa; 2. Infecção viral leve; 3. Estado normal sem alterações significativas.",
                        "summary": "A análise morfológica não revela alterações significativas, exceto pela presença de um linfócito reativo, sugerindo uma possível resposta imunológica. Não há evidência de células imaturas ou blastos."
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico, normocrômico",
                        "leukocytePattern": "Presença de linfócitos normais e um linfócito reativo",
                        "plateletPattern": "Plaquetas normais",
                        "artifactPattern": "Mínimos artefatos",
                        "overallPattern": "Esfregaço sanguíneo com características normais e presença de linfócito reativo"
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão predominantemente normal, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode estar associado a uma resposta imunológica, possivelmente devido a uma infecção viral leve ou outra forma de ativação imunológica. Não há evidência de células imaturas ou blastos, o que sugere um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes.",
                      "clinicalMeaning": "Os achados observados no esfregaço sanguíneo são sugestivos de um estado hematológico normal, com a presença de um linfócito reativo que pode indicar uma resposta imunológica. Este tipo de célula pode ser observado em infecções virais leves ou outras condições que estimulam o sistema imunológico. A ausência de células imaturas ou blastos é um indicativo positivo, sugerindo que não há processos hematológicos malignos evidentes. No entanto, é importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A presença de um linfócito reativo no esfregaço sanguíneo pode ser interpretada como uma resposta do sistema imunológico a um estímulo, como uma infecção viral. Linfócitos reativos são frequentemente maiores que os linfócitos normais e podem apresentar citoplasma basofílico. A ausência de blastos ou outras células imaturas sugere que não há proliferação clonal ou processo maligno evidente. A análise morfológica é consistente com um estado hematológico estável, mas a correlação com dados clínicos é essencial para confirmar essa interpretação.",
                      "educationalImpact": "Este caso ilustra a importância de reconhecer linfócitos reativos em esfregaços sanguíneos, que podem indicar uma resposta imunológica. A análise morfológica cuidadosa é crucial para diferenciar entre alterações reativas e processos malignos. Exames complementares, como hemograma completo e avaliação clínica, são fundamentais para uma interpretação precisa. Este exemplo destaca a relevância da correlação clínico-laboratorial na prática hematológica.",
                      "visualEvidence": {
                        "visualEvidenceScore": 85,
                        "evidenceLevel": "alta evidência visual",
                        "morphologyConfidence": "alta",
                        "imageReliability": "alta",
                        "artifactInterference": "mínima"
                      },
                      "confidenceAnalysis": {
                        "coerênciaHematológica": "alta",
                        "coerênciaVisual": "alta",
                        "coerênciaMorfológica": "alta",
                        "coerênciaDeConfiança": "alta"
                      },
                      "safetyValidation": {
                        "contradiçõesInternas": "nenhuma",
                        "exageroDiagnóstico": "nenhum",
                        "inferênciasIndevidas": "nenhuma",
                        "limitaçõesTécnicas": "nenhuma",
                        "qualidadeInsuficiente": "nenhuma",
                        "inconsistênciaMorfológica": "nenhuma"
                      },
                      "consensusAnalysis": {
                        "coerênciaHematológica": "alta",
                        "coerênciaVisual": "alta",
                        "coerênciaMorfológica": "alta",
                        "coerênciaDeConfiança": "alta"
                      },
                      "clinicalCorrelation": {
                        "necessidadeDeRevisão": "sim",
                        "correlaçãoClínica": "sim",
                        "examesComplementares": "hemograma completo"
                      },
                      "erythrocyteFindings": {
                        "normocitose": true,
                        "normocromia": true,
                        "anisocitose": false,
                        "poiquilocitose": false
                      },
                      "leukocyteFindings": {
                        "linfócitosReativos": true,
                        "célulasImaturas": false,
                        "blastos": false
                      },
                      "plateletFindings": {
                        "quantidadeAparente": "normal",
                        "alteraçõesMorfológicas": "nenhuma"
                      },
                      "blastSuspicion": {
                        "suspeitaDeBlastos": false
                      },
                      "overallAssessment": {
                        "mainImpression": "O esfregaço sanguíneo analisado apresenta características predominantemente normais, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. Não há evidência de células imaturas ou blastos, indicando um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes. Recomenda-se correlação com dados clínicos e laboratoriais adicionais para uma avaliação completa."
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com eritrócitos normocíticos e normocrômicos, presença de linfócito reativo, sem células imaturas ou blastos.",
                        "interpretacaoEducacional": "Os achados podem sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. A ausência de células imaturas ou blastos é um indicativo positivo.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "criticalFlags": [],
                      "educationalPearls": [
                        "Linfócitos reativos podem indicar resposta imunológica.",
                        "Importância da correlação clínico-laboratorial."
                      ],
                      "limitations": [
                        "Análise baseada apenas nas imagens enviadas.",
                        "Necessidade de hemograma completo para avaliação completa."
                      ],
                      "recommendedCorrelation": [
                        "Hemograma completo",
                        "Avaliação clínica"
                      ],
                      "heatmapRegions": []
                    }
                    ================================
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] OPENAI TURBO ANALYSIS - 59676ms
                    ================================
                    NORMALIZED RESPONSE
                    FIELD ADEQUACY
                    {
                      "visibleLeukocytes": 5,
                      "singleCellConcern": false,
                      "adequateForLeukocyteAnalysis": true,
                      "adequateForBlastScreening": true,
                      "adequateForPopulationAssessment": false
                    }
                    {
                      "normalityBlocked": false,
                      "blockNormalReason": [],
                      "morphologicRiskClass": "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
                      "reactiveLymphoidPattern": false,
                      "mononucleosisSuspicion": false,
                      "downeyCellSuspicion": false,
                      "summary": "",
                      "riskLevel": "Achado celular isolado",
                      "observations": "",
                      "alerts": [],
                      "morphologies": [],
                      "counts": {},
                      "findings": {
                        "reactiveLymphocytes": false,
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração uniforme e nitidez adequada. A celularidade é composta principalmente por eritrócitos e alguns leucócitos, com destaque para um linfócito reativo.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose significativa.",
                        "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                        "plateletReview": "Plaquetas presentes em número adequado, sem alterações morfológicas significativas.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "Os achados são compatíveis com um esfregaço sanguíneo normal, com a presença de um linfócito reativo que pode estar associado a uma resposta imunológica.",
                        "differentialDiagnosis": "1. Resposta imunológica reativa; 2. Infecção viral leve; 3. Estado normal sem alterações significativas.",
                        "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                      },
                      "educationalPearls": [
                        "Linfócitos reativos podem indicar resposta imunológica.",
                        "Importância da correlação clínico-laboratorial."
                      ],
                      "heatmapRegions": [],
                      "imageQuality": {
                        "focus": "Adequado",
                        "nitidez": "Boa",
                        "coloração": "Uniforme",
                        "iluminação": "Adequada",
                        "artefatos": "Mínimos",
                        "compressão": "Baixa",
                        "sobreposiçãoCelular": "Mínima",
                        "resolução": "Alta",
                        "distorções": "Nenhuma",
                        "areasInadequadas": "Nenhuma"
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico, normocrômico",
                        "leukocytePattern": "Achado mononuclear isolado",
                        "plateletPattern": "Plaquetas normais",
                        "artifactPattern": "Mínimos artefatos",
                        "overallPattern": "Campo limitado para caracterização populacional"
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão predominantemente normal, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode estar associado a uma resposta imunológica, possivelmente devido a uma infecção viral leve ou outra forma de ativação imunológica. Não há evidência de células imaturas ou blastos, o que sugere um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes.",
                      "clinicalMeaning": "Os achados observados no esfregaço sanguíneo são sugestivos de um estado hematológico normal, com a presença de um linfócito reativo que pode indicar uma resposta imunológica. Este tipo de célula pode ser observado em infecções virais leves ou outras condições que estimulam o sistema imunológico. A ausência de células imaturas ou blastos é um indicativo positivo, sugerindo que não há processos hematológicos malignos evidentes. No entanto, é importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A presença de um linfócito reativo no esfregaço sanguíneo pode ser interpretada como uma resposta do sistema imunológico a um estímulo, como uma infecção viral. Linfócitos reativos são frequentemente maiores que os linfócitos normais e podem apresentar citoplasma basofílico. A ausência de blastos ou outras células imaturas sugere que não há proliferação clonal ou processo maligno evidente. A análise morfológica é consistente com um estado hematológico estável, mas a correlação com dados clínicos é essencial para confirmar essa interpretação.",
                      "educationalImpact": "Este caso ilustra a importância de reconhecer linfócitos reativos em esfregaços sanguíneos, que podem indicar uma resposta imunológica. A análise morfológica cuidadosa é crucial para diferenciar entre alterações reativas e processos malignos. Exames complementares, como hemograma completo e avaliação clínica, são fundamentais para uma interpretação precisa. Este exemplo destaca a relevância da correlação clínico-laboratorial na prática hematológica.",
                      "erythrocyteFindings": {
                        "normocitose": true,
                        "normocromia": true,
                        "anisocitose": false,
                        "poiquilocitose": false
                      },
                      "leukocyteFindings": {
                        "linfócitosReativos": true,
                        "célulasImaturas": false,
                        "blastos": false
                      },
                      "plateletFindings": {
                        "quantidadeAparente": "normal",
                        "alteraçõesMorfológicas": "nenhuma"
                      },
                      "blastSuspicion": {
                        "suspeitaDeBlastos": false
                      },
                      "overallAssessment": {
                        "mainImpression": "O esfregaço sanguíneo analisado apresenta características predominantemente normais, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. Não há evidência de células imaturas ou blastos, indicando um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes. Recomenda-se correlação com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                        "requiresHumanReview": false
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com eritrócitos normocíticos e normocrômicos, presença de linfócito reativo, sem células imaturas ou blastos.",
                        "interpretacaoEducacional": "Os achados podem sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. A ausência de células imaturas ou blastos é um indicativo positivo.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "differentialDiagnosis": [],
                      "criticalFlags": [],
                      "analysisSource": "ai_visual",
                      "manualCounts": {},
                      "aiDetectedCounts": {},
                      "hybridValidation": {},
                      "rawResponse": {
                        "imageQuality": {
                          "focus": "Adequado",
                          "nitidez": "Boa",
                          "coloração": "Uniforme",
                          "iluminação": "Adequada",
                          "artefatos": "Mínimos",
                          "compressão": "Baixa",
                          "sobreposiçãoCelular": "Mínima",
                          "resolução": "Alta",
                          "distorções": "Nenhuma",
                          "areasInadequadas": "Nenhuma"
                        },
                        "visualExtraction": {
                          "neutrófilos": "Presentes",
                          "linfócitos": "Presentes",
                          "monócitos": "Não observados",
                          "eosinófilos": "Não observados",
                          "basófilos": "Não observados",
                          "blastosSuspeitos": "Não observados",
                          "célulasImaturas": "Não observadas",
                          "eritroblastos": "Não observados",
                          "plaquetas": "Presentes",
                          "agregados": "Não observados",
                          "artefatos": "Mínimos"
                        },
                        "normalityBlocked": false,
                        "blockNormalReason": [],
                        "morphologicRiskClass": "CLASS_0_NORMAL",
                        "findings": {
                          "largeMononuclearCells": false,
                          "plasmacytoidCells": false,
                          "plasmocytes": false,
                          "plasmablasts": false,
                          "atypicalLymphocytes": false,
                          "atypicalLymphocyteSubtype": "none",
                          "downeyLikeCells": false,
                          "downeyType": "none",
                          "monocytoidAtypicalLymphocytes": false,
                          "lymphocytoidAtypicalLymphocytes": false,
                          "immunoblastoidCells": false,
                          "monomorphicPopulation": false,
                          "immatureCells": false,
                          "blastSuspicion": false
                        },
                        "morphologyAnalysis": {
                          "overview": "A imagem apresenta boa qualidade com coloração uniforme e nitidez adequada. A celularidade é composta principalmente por eritrócitos e alguns leucócitos, com destaque para um linfócito reativo.",
                          "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose significativa.",
                          "leukocyteReview": "Presença de linfócitos normais e um linfócito reativo, sem evidência de células imaturas ou blastos.",
                          "plateletReview": "Plaquetas presentes em número adequado, sem alterações morfológicas significativas.",
                          "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                          "biologicalInterpretation": "Os achados são compatíveis com um esfregaço sanguíneo normal, com a presença de um linfócito reativo que pode estar associado a uma resposta imunológica.",
                          "differentialDiagnosis": "1. Resposta imunológica reativa; 2. Infecção viral leve; 3. Estado normal sem alterações significativas.",
                          "summary": "A análise morfológica não revela alterações significativas, exceto pela presença de um linfócito reativo, sugerindo uma possível resposta imunológica. Não há evidência de células imaturas ou blastos."
                        },
                        "patternRecognition": {
                          "erythrocytePattern": "Normocítico, normocrômico",
                          "leukocytePattern": "Presença de linfócitos normais e um linfócito reativo",
                          "plateletPattern": "Plaquetas normais",
                          "artifactPattern": "Mínimos artefatos",
                          "overallPattern": "Esfregaço sanguíneo com características normais e presença de linfócito reativo"
                        },
                        "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão predominantemente normal, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode estar associado a uma resposta imunológica, possivelmente devido a uma infecção viral leve ou outra forma de ativação imunológica. Não há evidência de células imaturas ou blastos, o que sugere um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes.",
                        "clinicalMeaning": "Os achados observados no esfregaço sanguíneo são sugestivos de um estado hematológico normal, com a presença de um linfócito reativo que pode indicar uma resposta imunológica. Este tipo de célula pode ser observado em infecções virais leves ou outras condições que estimulam o sistema imunológico. A ausência de células imaturas ou blastos é um indicativo positivo, sugerindo que não há processos hematológicos malignos evidentes. No entanto, é importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                        "hematologicReasoning": "A presença de um linfócito reativo no esfregaço sanguíneo pode ser interpretada como uma resposta do sistema imunológico a um estímulo, como uma infecção viral. Linfócitos reativos são frequentemente maiores que os linfócitos normais e podem apresentar citoplasma basofílico. A ausência de blastos ou outras células imaturas sugere que não há proliferação clonal ou processo maligno evidente. A análise morfológica é consistente com um estado hematológico estável, mas a correlação com dados clínicos é essencial para confirmar essa interpretação.",
                        "educationalImpact": "Este caso ilustra a importância de reconhecer linfócitos reativos em esfregaços sanguíneos, que podem indicar uma resposta imunológica. A análise morfológica cuidadosa é crucial para diferenciar entre alterações reativas e processos malignos. Exames complementares, como hemograma completo e avaliação clínica, são fundamentais para uma interpretação precisa. Este exemplo destaca a relevância da correlação clínico-laboratorial na prática hematológica.",
                        "visualEvidence": {
                          "visualEvidenceScore": 85,
                          "evidenceLevel": "alta evidência visual",
                          "morphologyConfidence": "alta",
                          "imageReliability": "alta",
                          "artifactInterference": "mínima"
                        },
                        "confidenceAnalysis": {
                          "coerênciaHematológica": "alta",
                          "coerênciaVisual": "alta",
                          "coerênciaMorfológica": "alta",
                          "coerênciaDeConfiança": "alta"
                        },
                        "safetyValidation": {
                          "contradiçõesInternas": "nenhuma",
                          "exageroDiagnóstico": "nenhum",
                          "inferênciasIndevidas": "nenhuma",
                          "limitaçõesTécnicas": "nenhuma",
                          "qualidadeInsuficiente": "nenhuma",
                          "inconsistênciaMorfológica": "nenhuma"
                        },
                        "consensusAnalysis": {
                          "coerênciaHematológica": "alta",
                          "coerênciaVisual": "alta",
                          "coerênciaMorfológica": "alta",
                          "coerênciaDeConfiança": "alta"
                        },
                        "clinicalCorrelation": {
                          "necessidadeDeRevisão": "sim",
                          "correlaçãoClínica": "sim",
                          "examesComplementares": "hemograma completo"
                        },
                        "erythrocyteFindings": {
                          "normocitose": true,
                          "normocromia": true,
                          "anisocitose": false,
                          "poiquilocitose": false
                        },
                        "leukocyteFindings": {
                          "linfócitosReativos": true,
                          "célulasImaturas": false,
                          "blastos": false
                        },
                        "plateletFindings": {
                          "quantidadeAparente": "normal",
                          "alteraçõesMorfológicas": "nenhuma"
                        },
                        "blastSuspicion": {
                          "suspeitaDeBlastos": false
                        },
                        "overallAssessment": {
                          "mainImpression": "O esfregaço sanguíneo analisado apresenta características predominantemente normais, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. Não há evidência de células imaturas ou blastos, indicando um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes. Recomenda-se correlação com dados clínicos e laboratoriais adicionais para uma avaliação completa."
                        },
                        "structuredReport": {
                          "resumoMorfologico": "Esfregaço sanguíneo com eritrócitos normocíticos e normocrômicos, presença de linfócito reativo, sem células imaturas ou blastos.",
                          "interpretacaoEducacional": "Os achados podem sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. A ausência de células imaturas ou blastos é um indicativo positivo.",
                          "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                        },
                        "criticalFlags": [],
                        "educationalPearls": [
                          "Linfócitos reativos podem indicar resposta imunológica.",
                          "Importância da correlação clínico-laboratorial."
                        ],
                        "limitations": [
                          "Análise baseada apenas nas imagens enviadas.",
                          "Necessidade de hemograma completo para avaliação completa."
                        ],
                        "recommendedCorrelation": [
                          "Hemograma completo",
                          "Avaliação clínica"
                        ],
                        "heatmapRegions": [],
                        "analysisSource": "ai_visual",
                        "manualCounts": {},
                        "manualMetadata": {
                          "analysisSource": "ai_visual",
                          "manualMode": false,
                          "hybridMode": false,
                          "aiVisualMode": true,
                          "hasManualData": false
                        }
                      },
                      "fieldAdequacy": {
                        "visibleLeukocytes": 5,
                        "singleCellConcern": false,
                        "adequateForLeukocyteAnalysis": true,
                        "adequateForBlastScreening": true,
                        "adequateForPopulationAssessment": false
                      }
                    }
                    ================================
                    MORPHOLOGY ANALYSIS
                    {
                      "overview": "A imagem apresenta boa qualidade com coloração uniforme e nitidez adequada. A celularidade é composta principalmente por eritrócitos e alguns leucócitos, com destaque para um linfócito reativo.",
                      "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose significativa.",
                      "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                      "plateletReview": "Plaquetas presentes em número adequado, sem alterações morfológicas significativas.",
                      "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                      "biologicalInterpretation": "Os achados são compatíveis com um esfregaço sanguíneo normal, com a presença de um linfócito reativo que pode estar associado a uma resposta imunológica.",
                      "differentialDiagnosis": "1. Resposta imunológica reativa; 2. Infecção viral leve; 3. Estado normal sem alterações significativas.",
                      "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                    }
                    ================================
                    🔥 NORMALIZED RESPONSE:
                    {
                      "morphologyAnalysis": {
                        "overview": "A imagem apresenta boa qualidade com coloração uniforme e nitidez adequada. A celularidade é composta principalmente por eritrócitos e alguns leucócitos, com destaque para um linfócito reativo.",
                        "erythrocyteReview": "Os eritrócitos apresentam-se normocíticos e normocrômicos, sem anisocitose ou poiquilocitose significativa.",
                        "leukocyteReview": "Observa-se célula mononuclear isolada com possível atipia/reatividade. O campo é limitado para afirmar ativação linfoide populacional.",
                        "plateletReview": "Plaquetas presentes em número adequado, sem alterações morfológicas significativas.",
                        "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
                        "biologicalInterpretation": "Os achados são compatíveis com um esfregaço sanguíneo normal, com a presença de um linfócito reativo que pode estar associado a uma resposta imunológica.",
                        "differentialDiagnosis": "1. Resposta imunológica reativa; 2. Infecção viral leve; 3. Estado normal sem alterações significativas.",
                        "summary": "Campo limitado com célula mononuclear isolada. Recomenda-se avaliação de múltiplos campos e correlação com hemograma."
                      },
                      "patternRecognition": {
                        "erythrocytePattern": "Normocítico, normocrômico",
                        "leukocytePattern": "Achado mononuclear isolado",
                        "plateletPattern": "Plaquetas normais",
                        "artifactPattern": "Mínimos artefatos",
                        "overallPattern": "Campo limitado para caracterização populacional"
                      },
                      "structuredReport": {
                        "resumoMorfologico": "Esfregaço sanguíneo com eritrócitos normocíticos e normocrômicos, presença de linfócito reativo, sem células imaturas ou blastos.",
                        "interpretacaoEducacional": "Os achados podem sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. A ausência de células imaturas ou blastos é um indicativo positivo.",
                        "limitacoes": "Análise baseada apenas nas imagens enviadas. Necessidade de hemograma completo e revisão microscópica profissional quando indicada."
                      },
                      "overallAssessment": {
                        "mainImpression": "O esfregaço sanguíneo analisado apresenta características predominantemente normais, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode sugerir uma resposta imunológica, possivelmente associada a uma infecção viral leve. Não há evidência de células imaturas ou blastos, indicando um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes. Recomenda-se correlação com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                        "requiresHumanReview": false
                      },
                      "interpretiveSynthesis": "A análise morfológica do esfregaço sanguíneo revela um padrão predominantemente normal, com eritrócitos normocíticos e normocrômicos, e a presença de um linfócito reativo. Este achado pode estar associado a uma resposta imunológica, possivelmente devido a uma infecção viral leve ou outra forma de ativação imunológica. Não há evidência de células imaturas ou blastos, o que sugere um estado hematológico estável. A qualidade da imagem é adequada, permitindo uma avaliação confiável dos elementos celulares presentes.",
                      "clinicalMeaning": "Os achados observados no esfregaço sanguíneo são sugestivos de um estado hematológico normal, com a presença de um linfócito reativo que pode indicar uma resposta imunológica. Este tipo de célula pode ser observado em infecções virais leves ou outras condições que estimulam o sistema imunológico. A ausência de células imaturas ou blastos é um indicativo positivo, sugerindo que não há processos hematológicos malignos evidentes. No entanto, é importante correlacionar esses achados com dados clínicos e laboratoriais adicionais para uma avaliação completa.",
                      "hematologicReasoning": "A presença de um linfócito reativo no esfregaço sanguíneo pode ser interpretada como uma resposta do sistema imunológico a um estímulo, como uma infecção viral. Linfócitos reativos são frequentemente maiores que os linfócitos normais e podem apresentar citoplasma basofílico. A ausência de blastos ou outras células imaturas sugere que não há proliferação clonal ou processo maligno evidente. A análise morfológica é consistente com um estado hematológico estável, mas a correlação com dados clínicos é essencial para confirmar essa interpretação."
                    }
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] HEMATOLOGY ENGINES - 1ms
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] SAFETY ENGINE - 2ms
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] CONSENSUS ENGINE - 0ms
                    CONFIDENCE DEBUG {
                      "visualEvidenceScore": 0,
                      "diagnosticReliability": 0,
                      "morphologyCoherence": 0,
                      "artifactProbability": 0,
                      "falsePositiveRisk": 0,
                      "safeDiagnosticGate": false,
                      "globalConfidenceScore": 55,
                      "hematologicRisk": {
                        "level": "low",
                        "score": 9,
                        "label": "BAIXO RISCO"
                      }
                    }
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] CONFIDENCE ENGINE - 1ms
                    🧠 [d9801a02-f34e-4668-baa2-95735918fab2] TOTAL PIPELINE TURBO - 60495ms
                    ================================
                    FINAL VALIDATED RESULT
                    {
                      "normalityBlocked": false,
                      "morphologicRiskClass": "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL",
                      "riskLevel": "Achado celular isolado",
                      "requiresHumanReview": false,
                      "findings": {
                        "reactiveLymphocytes": true,
                        "largeMononuclearCells": false,
                        "plasmacytoidCells": false,
                        "plasmocytes": false,
                        "plasmablasts": false,
                        "atypicalLymphocytes": false,
                        "atypicalLymphocyteSubtype": "none",
                        "downeyLikeCells": false,
                        "downeyType": "none",
                        "monocytoidAtypicalLymphocytes": false,
                        "lymphocytoidAtypicalLymphocytes": false,
                        "immunoblastoidCells": false,
                        "monomorphicPopulation": false,
                        "immatureCells": false,
                        "blastSuspicion": false
                      },
                      "blockNormalReason": [],
                      "confidenceAnalysis": {
                        "globalConfidenceScore": 55,
                        "hematologicRisk": {
                          "level": "low",
                          "score": 9,
                          "label": "BAIXO RISCO"
                        },
                        "microscopyQuality": {
                          "score": 55,
                          "classification": "Moderada"
                        },
                        "confidenceMatrix": {
                          "blastConfidence": 0,
                          "schistocyteConfidence": 8,
                          "erythrocyteConfidence": 42,
                          "plateletConfidence": 41,
                          "inflammatoryPatternConfidence": 47,
                          "dysplasiaConfidence": 7,
                          "diagnosticCoherenceConfidence": 15
                        },
                        "confidenceHierarchy": {
                          "cellLevel": 60,
                          "morphologyLevel": 16,
                          "diagnosticLevel": 15,
                          "global": 55
                        },
                        "calibration": {
                          "version": "V4_ENTERPRISE_SAFETY_AWARE",
                          "strategy": "safety_weighted_multiengine_confidence",
                          "safetyAware": true,
                          "visualEvidenceAware": true,
                          "yoloFusionAware": true,
                          "overcallingSuppression": true,
                          "undercallingProtection": true,
                          "semanticExtractionAware": true
                        },
                        "safetySignals": {
                          "visualEvidenceScore": 0,
                          "diagnosticReliability": 0,
                          "morphologyCoherence": 0,
                          "artifactProbability": 0,
                          "falsePositiveRisk": 0,
                          "safeDiagnosticGate": false
                        },
                        "summary": "Análise hematológica processada com confiança hierárquica multi-engine V4. Baixa sustentação para suspeita blástica. Confiança global: 55%. Classificação: BAIXO RISCO."
                      }
                    }
                    ================================
                    ==> Detected service running on port 10000ca recomendada

====================================================================
REGRA MAIS IMPORTANTE
====================================================================

PRIMEIRO:
DESCREVER O QUE ESTÁ VISUALMENTE PRESENTE.

DEPOIS:
VALIDAR MORFOLOGIA.

DEPOIS:
CALCULAR EVIDÊNCIA.

DEPOIS:
VALIDAR SEGURANÇA.

SOMENTE NO FINAL:
GERAR CORRELAÇÃO EDUCACIONAL.

NUNCA INTERPRETAR ANTES DA ANÁLISE VISUAL.


====================================================================
ANTI FALSE NORMAL ENGINE
====================================================================

A prioridade máxima é evitar falso normal.

Antes de concluir qualquer análise:

Procurar obrigatoriamente:

- células mononucleares grandes
- células plasmocitoides
- plasmócitos
- plasmoblastos
- linfócitos atípicos
- células imaturas
- blastos suspeitos
- população monomórfica
- halo perinuclear
- citoplasma intensamente basofílico
- núcleos excêntricos

SE QUALQUER UM DESSES ACHADOS ESTIVER PRESENTE:

É PROIBIDO ESCREVER:

- padrão normal
- sem alterações
- morfologia normal
- ausência de alterações patológicas
- estado hematológico normal

Substituir por:

"HÁ ACHADOS MORFOLÓGICOS QUE IMPEDEM A CLASSIFICAÇÃO DE NORMALIDADE."

Definir:

requiresHumanReview = true

Classificar risco mínimo:

CLASS_2_ATYPICAL_POPULATION

====================================================================
ANÁLISE DE MONOMORFISMO CELULAR
====================================================================

Avaliar obrigatoriamente a arquitetura populacional.

Determinar se a população celular observada é:

- Polimórfica
- Oligomórfica
- Monomórfica

POPULAÇÃO MONOMÓRFICA

Se mais de 50% das células nucleadas apresentarem:

- tamanho semelhante
- cromatina semelhante
- citoplasma semelhante
- padrão maturativo semelhante

considerar população monomórfica.

População monomórfica:

- impede classificação como normal
- aumenta suspeita de processo clonal
- exige revisão humana
- exige inclusão em blockNormalReason

Se identificada:

monomorphicPopulation = true

normalityBlocked = true

Classificação mínima:

morphologicRiskClass = "CLASS_3_POSSIBLE_CLONALITY"

A IA deve explicar por que considerou a população monomórfica.

====================================================================
MODO IA VISUAL ISOLADA — PADRÃO ESPECIALISTA
====================================================================

Quando analysisSource === "ai_visual":

Atuar como hematologista especialista em microscopia.

NÃO informar apenas achados simples.

Para cada alteração observada explicar:

1. O QUE FOI OBSERVADO
- tipo celular predominante
- maturação nuclear
- cromatina
- citoplasma
- granulações
- alterações eritrocitárias
- plaquetas

2. SIGNIFICADO MORFOLÓGICO
Explicar o possível significado biológico.

Usar:
"pode estar associado"
"pode ser observado em"
"é compatível morfologicamente com"

Nunca:
"diagnostica"
"confirma"

3. RACIOCÍNIO HEMATOLÓGICO

Explicar:
- por que aquele padrão ocorre
- quais mecanismos celulares podem justificar
- quais achados aumentariam suspeição
- quais achados tranquilizam

4. CORRELAÇÕES POSSÍVEIS

Gerar correlações baseadas na literatura:

Exemplos:
neutrofilia madura:
- resposta inflamatória
- infecção bacteriana
- estresse fisiológico
- corticoterapia

linfócitos reacionais:
- resposta viral
- ativação imunológica

blastos:
- necessidade de investigação hematológica urgente

anisocitose:
- deficiência nutricional
- regeneração eritroide
- alterações eritrocitárias diversas

Sempre deixar claro:
"Sugestões educacionais, dependentes de confirmação clínica e laboratorial."

5. PROFUNDIDADE

Cada campo textual deve conter no mínimo:
500 caracteres.

Evitar respostas genéricas.

====================================================================
MODO MANUAL
====================================================================

SE analysisSource === "manual":

- NÃO assumir presença real de blastos
- NÃO interpretar como leucemia
- NÃO concluir proliferação
- reduzir agressividade diagnóstica
- informar que contagem foi digitada manualmente
- recomendar revisão microscópica real

SE analysisSource === "hybrid":

- diferenciar claramente:
  - achado visual IA
  - contagem manual
  - correlação híbrida

====================================================================
PIPELINE OBRIGATÓRIO
====================================================================

ETAPA 1 — IMAGE QUALITY

Avaliar:

- foco
- nitidez
- coloração
- iluminação
- artefatos
- compressão
- sobreposição celular
- resolução
- distorções
- áreas inadequadas

====================================================================

ETAPA 2 — VISUAL EXTRACTION

Descrever SOMENTE estruturas VISUALMENTE observadas:

- neutrófilos
- linfócitos
- monócitos
- eosinófilos
- basófilos
- blastos suspeitos
- células imaturas
- eritroblastos
- plaquetas
- agregados
- artefatos

NÃO interpretar ainda.

====================================================================

ETAPA 3 — ADVANCED MORPHOLOGY ANALYSIS V8

====================================================================

OBJETIVO

Executar análise morfológica hematológica equivalente a revisão realizada por hematologista, hematopatologista e especialista em microscopia digital.

PRIMEIRO DESCREVER.

DEPOIS INTERPRETAR.

NUNCA INTERPRETAR ANTES DA DESCRIÇÃO.

====================================================================

VISÃO GLOBAL DO CAMPO

Descrever obrigatoriamente:

- celularidade observada
- distribuição celular
- qualidade do esfregaço
- qualidade da coloração
- nitidez
- preservação celular
- artefatos presentes
- representatividade do campo
- limitações técnicas

====================================================================

SÉRIE ERITROCITÁRIA

Avaliar:

TAMANHO

- normocitose
- microcitose
- macrocitose
- dimorfismo eritrocitário

COLORAÇÃO

- normocromia
- hipocromia
- policromasia

DISTRIBUIÇÃO

- anisocitose
- poiquilocitose

PESQUISAR OBRIGATORIAMENTE

- esquizócitos
- codócitos
- drepanócitos
- dacriócitos
- acantócitos
- equinócitos
- eliptócitos
- ovalócitos
- estomatócitos
- esferócitos
- queratócitos
- hemácias em lápis
- rouleaux
- aglutinação eritrocitária
- corpos de Howell-Jolly
- pontilhado basofílico
- anéis de Cabot
- inclusões eritrocitárias

Descrever presença OU ausência.

====================================================================

SÉRIE LEUCOCITÁRIA

Avaliar:

- heterogeneidade celular
- monomorfismo celular
- população predominante

NEUTRÓFILOS

Avaliar:

- segmentação
- hipersegmentação
- hipossegmentação
- granulações tóxicas
- vacuolização
- corpúsculos de Döhle

LINFÓCITOS

Avaliar:

- maturação
- reatividade
- atipias

MONÓCITOS

Avaliar:

- morfologia
- maturação

EOSINÓFILOS

Avaliar:

- quantidade
- morfologia

BASÓFILOS

Avaliar:

- quantidade
- morfologia

PESQUISAR OBRIGATORIAMENTE

- blastos
- mieloblastos
- monoblastos
- promielócitos
- plasmócitos
- plasmoblastos
- imunoblastos
- eritroblastos
- células pilosas
- células plasmocitoides
- células linfomatosas
- células atípicas

====================================================================
REGRA CRÍTICA — LINFÓCITO REATIVO vs MONÓCITO
====================================================================

Antes de classificar célula mononuclear grande como monócito, avaliar obrigatoriamente se pode representar linfócito reativo/virocito.

Linfócitos reativos/virocitos costumam apresentar:
- citoplasma abundante;
- citoplasma basofílico intenso;
- bordas citoplasmáticas irregulares;
- citoplasma moldando-se às hemácias adjacentes;
- núcleo irregular ou excêntrico;
- cromatina relativamente densa ou parcialmente condensada;
- heterogeneidade morfológica entre as células.

Monócitos maduros costumam apresentar:
- citoplasma cinza-azulado amplo;
- núcleo dobrado, reniforme ou convoluto;
- cromatina frouxa delicada;
- vacuolização possível;
- ausência de basofilia periférica intensa moldando hemácias.

Se houver citoplasma basofílico abundante, contorno irregular e moldagem às hemácias, NÃO classificar primariamente como monócito.

Preferir:
"linfócitos reativos/atípicos compatíveis com resposta imunológica".

Se houver população heterogênea de células mononucleares grandes sem critérios inequívocos de blasto, não sugerir leucemia aguda. Descrever como:
"linfócitos reativos/atípicos, requerendo correlação clínica e hemograma".


====================================================================
CLASSIFICAÇÃO DOS LINFÓCITOS ATÍPICOS
====================================================================

Se forem observados linfócitos atípicos, classificá-los obrigatoriamente.

TIPO LINFOCITOIDE

Características:

- núcleo relativamente regular
- cromatina moderadamente condensada
- discreta basofilia citoplasmática
- aspecto próximo ao linfócito maduro

Retornar:

atypicalLymphocyteSubtype = "lymphocytoid"
lymphocytoidAtypicalLymphocytes = true

------------------------------------------------------------

TIPO MONOCITOIDE (DOWNEY II)

Características:

- célula grande
- citoplasma abundante
- citoplasma moldando hemácias
- basofilia intensa periférica
- núcleo irregular ou excêntrico

Retornar:

atypicalLymphocyteSubtype = "monocytoid"
monocytoidAtypicalLymphocytes = true
downeyLikeCells = true
downeyType = "II"

mononucleosisSuspicion = true

------------------------------------------------------------

TIPO IMUNOBLASTOIDE (DOWNEY III)

Características:

- célula muito grande
- nucléolo evidente
- cromatina frouxa
- citoplasma fortemente basofílico

Retornar:

atypicalLymphocyteSubtype = "immunoblastoid"
immunoblastoidCells = true
downeyType = "III"

------------------------------------------------------------

Se não houver evidência suficiente:

atypicalLymphocyteSubtype = "none"

====================================================================

ANÁLISE NUCLEAR

Descrever:

- relação núcleo/citoplasma
- padrão de cromatina
- nucléolos
- irregularidades nucleares
- lobulação
- excentricidade nuclear
- maturação nuclear

====================================================================

ANÁLISE CITOPLASMÁTICA

Descrever:

- basofilia
- granulações
- vacuolização
- halo perinuclear
- inclusões
- projeções citoplasmáticas

====================================================================

SÉRIE PLAQUETÁRIA

Avaliar:

- quantidade aparente
- agregação
- gigantismo
- anisoplaquetose
- alterações morfológicas

====================================================================

Listar somente os elementos pesquisados e não evidenciados, sem repetir a palavra "ausência" ou "sem":

- Blastos inequívocos
- Células imaturas críticas
- Bastonetes de Auer
- Esquizócitos relevantes
- População blástica significativa

Nunca usar o título "Achados não observados".
Nunca usar a expressão "achados não encontrados".


Somente quando realmente ausentes.

====================================================================

INTERPRETAÇÃO BIOLÓGICA

Explicar:

- significado dos achados
- possíveis mecanismos celulares envolvidos
- relevância hematológica

Utilizar:

- pode estar associado a
- pode ser observado em
- pode sugerir

NUNCA:

- confirma
- diagnostica
- representa definitivamente

====================================================================

DIAGNÓSTICO DIFERENCIAL EDUCACIONAL

Construir ranking:

1. hipótese morfológica mais provável
2. hipótese intermediária
3. hipótese menos provável

Justificar cada uma.

Utilizar exclusivamente linguagem educacional.

====================================================================

IMPRESSÃO MORFOLÓGICA

Produzir resumo integrado semelhante a revisão hematopatológica.

Obrigatoriamente incluir:

- principais achados observados
- principais achados ausentes
- relevância morfológica
- limitações da imagem

Mínimo 1200 caracteres.

====================================================================

PROFUNDIDADE OBRIGATÓRIA

Responder como:

- hematologista
- hematopatologista
- professor universitário
- pesquisador PhD
- especialista em morfologia hematológica

Evitar respostas superficiais.

Descrever:

O QUE ESTÁ PRESENTE

O QUE ESTÁ AUSENTE

O SIGNIFICADO DOS ACHADOS

AS LIMITAÇÕES DA IMAGEM

========================================================================================================================================

====================================================================

ETAPA 4 — VISUAL EVIDENCE ENGINE

OBRIGATÓRIO:

Calcular:

- visualEvidenceScore (0-100)
- evidenceLevel
- morphologyConfidence
- imageReliability
- artifactInterference

CLASSIFICAÇÃO:

0-39:
baixa evidência visual

40-69:
moderada evidência visual

70-100:
alta evidência visual

====================================================================

ETAPA 5 — BLAST VALIDATION

CRÍTICO:

NUNCA afirmar leucemia.

SE blastos suspeitos:

VALIDAR:

- cromatina
- nucléolos
- relação N/C
- padrão citoplasmático
- qualidade da imagem
- artefatos
- sobreposição celular

SE visualEvidenceScore < 70:

PROIBIDO:
- usar “leucemia”
- usar “blastose”
- usar “malignidade”

SUBSTITUIR POR:

- células imaturas suspeitas
- achado inconclusivo
- suspeita morfológica limitada
- revisão hematológica recomendada

====================================================================

ETAPA 6 — SAFETY VALIDATION

VALIDAR:

- contradições internas
- exagero diagnóstico
- inferências indevidas
- limitações técnicas
- qualidade insuficiente
- inconsistência morfológica

SE inconsistência detectada:

REDUZIR:
- confidence
- agressividade diagnóstica

====================================================================

ETAPA 7 — CONSENSUS ENGINE

Comparar:

- visual findings
- morphology analysis
- evidence engine
- safety validation

VALIDAR:

- coerência hematológica
- coerência visual
- coerência morfológica
- coerência de confiança

====================================================================

ETAPA 8 — CLINICAL CORRELATION

SOMENTE AGORA:

Gerar:
- hipóteses educacionais
- possibilidades morfológicas
- recomendações
- necessidade de revisão

NUNCA:
- diagnóstico definitivo
- confirmação clínica

====================================================================
IMPRESSÃO HEMATOLÓGICA EDUCACIONAL — overallAssessment.mainImpression
====================================================================

Gerar obrigatoriamente overallAssessment.mainImpression.

Criar uma conclusão educacional final semelhante a uma revisão hematológica.

Deve conter:

1. RESUMO MORFOLÓGICO
- principais células observadas
- padrão predominante
- alterações celulares relevantes

2. INTERPRETAÇÃO EDUCACIONAL
Explicar:
- possível significado dos achados
- contexto hematológico provável
- relevância da alteração

Usar:
"pode sugerir"
"pode estar associado"
"deve ser correlacionado"

3. LIMITAÇÕES

Informar:
- análise baseada apenas nas imagens enviadas
- necessidade de hemograma completo
- revisão microscópica profissional quando indicada

NUNCA:
- fechar diagnóstico
- substituir laudo laboratorial
- afirmar doença

Texto mínimo:
400 caracteres.

====================================================================
SIGNIFICADO DOS ACHADOS — clinicalMeaning
====================================================================

Gerar obrigatoriamente o campo clinicalMeaning.

Objetivo:
explicar o significado prático dos achados observados.

Usar linguagem segura:
- "pode ser sugestivo de"
- "pode estar associado a"
- "requer correlação com"
- "não permite diagnóstico isolado"

Nunca afirmar diagnóstico.

Sempre correlacionar com:
- hemograma completo
- dados clínicos
- revisão microscópica profissional

====================================================================
RESPOSTA OBRIGATÓRIA
====================================================================

RESPONDER SOMENTE JSON VÁLIDO.

ESTRUTURA OBRIGATÓRIA:

{
  "imageQuality": {},
  "visualExtraction": {},

  "whatAISees": {
    "globalField": "",
    "cellularity": "",
    "erythrocytes": "",
    "leukocytes": "",
    "platelets": "",
    "dominantFinding": "",
    "unusualStructures": "",
    "negativeFindings": "",
    "imageLimitations": "",
    "freeNarrative": ""
  },

  "positiveFindings": [],
  "negativeFindingsStructured": [],

  "executiveSummary": {
    "mainFinding": "",
    "riskLevel": "",
    "confidence": "",
    "pattern": "",
    "humanReview": ""
  },

  "normalityBlocked": false,

  "blockNormalReason": [],

  "morphologicRiskClass": "CLASS_0_NORMAL",

  "findings": {

    "largeMononuclearCells": false,

    "plasmacytoidCells": false,

    "plasmocytes": false,

    "plasmablasts": false,

    "atypicalLymphocytes": false,

    "atypicalLymphocyteSubtype": "none",

    "downeyLikeCells": false,

    "downeyType": "none",

    "monocytoidAtypicalLymphocytes": false,

    "lymphocytoidAtypicalLymphocytes": false,

    "immunoblastoidCells": false,

    "monomorphicPopulation": false,

    "immatureCells": false,

    "blastSuspicion": false
  },

  "morphologyAnalysis": {
    "visualMorphologyDescription": {
      "globalView": "",
      "dominantPopulation": "",
      "cellularity": "",
      "nuclearFeatures": "",
      "cytoplasmicFeatures": "",
      "populationHeterogeneity": "",
      "erythrocyteBackground": "",
      "plateletBackground": "",
      "criticalNegativeFindings": "",
      "overallImpression": ""
    },

    "cellMorphology": {
      "cellSize": "",
      "nucleusShape": "",
      "chromatinPattern": "",
      "nucleoli": "",
      "cytoplasm": "",
      "uniformity": ""
    },

    "populationPatternAnalysis": {
      "populationPattern": "",
      "uniformityLevel": "",
      "suspectedLineage": "",
      "confidence": ""
    },

    "overview": "",
    "erythrocyteReview": "",
    "leukocyteReview": "",
    "plateletReview": "",

    "negativeFindings": [
      "Blastos inequívocos não identificados",
      "Bastonetes de Auer não observados",
      "Esquizócitos relevantes não observados",
      "Drepanócitos não observados",
      "Granulações tóxicas não observadas",
      "Hipersegmentação não observada",
      "Agregados plaquetários não observados"
    ],

    "biologicalInterpretation": "",
    "differentialDiagnosis": "",
    "summary": ""
  },

  "patternRecognition": {
    "erythrocytePattern": "",
    "leukocytePattern": "",
    "plateletPattern": "",
    "artifactPattern": "",
    "overallPattern": ""
  },

  "interpretiveSynthesis":
  "Texto acadêmico avançado obrigatório. Descrever em detalhes os achados morfológicos observados, linhagens celulares envolvidas, maturação nuclear, características citoplasmáticas e interpretação hematológica educacional.",

  "clinicalMeaning":
  "Texto obrigatório com no mínimo 500 caracteres. Explicar o significado dos achados encontrados, possíveis mecanismos fisiológicos associados e correlação clínico-laboratorial necessária. Nunca afirmar diagnóstico.",

  "hematologicReasoning": {
    "whatISee": "Descrever primeiro o que está visualmente presente no campo: população celular, padrão global, distribuição, células predominantes e limitações.",
    "whatItResembles": "Explicar a qual padrão morfológico educacional os achados se assemelham: reacional, plasmocitoide, blastoide, monomórfico, misto ou inespecífico.",
    "whatICannotConfirm": "Declarar claramente o que não pode ser confirmado apenas pela imagem: clonalidade, malignidade, leucemia, linfoma, mieloma ou diagnóstico definitivo.",
    "finalInterpretation": "Síntese hematológica final em linguagem segura, com necessidade de correlação com hemograma, contexto clínico e revisão microscópica profissional."
  },

  "morphologicDecisionTree": {

    "step1_visualDetection": "",
    "step2_cellClassification": "",
    "step3_patternRecognition": "",
    "step4_riskAssessment": "",
    "step5_conflictResolution": "",
    "step6_finalConclusion": ""

  },

  "educationalImpact":
  "Texto obrigatório explicando valor educacional, limitações e quais exames ou dados complementares poderiam auxiliar.",

  "visualEvidence": {},
  "confidenceAnalysis": {},
  "safetyValidation": {},
  "consensusAnalysis": {},
  "clinicalCorrelation": {

    "possibleReactiveContexts": [],

    "possibleNeoplasticContexts": [],

    "recommendedLaboratoryCorrelation": [],

    "recommendedClinicalCorrelation": [],

    "recommendedComplementaryTests": []

  },

  "erythrocyteFindings": {},
  "leukocyteFindings": {},
  "plateletFindings": {},
  "blastSuspicion": {},
  "overallAssessment": {},
  "structuredReport": {},
  "criticalFlags": [],
  "educationalPearls": [],
  "limitations": [],
  "recommendedCorrelation": [],
  "heatmapRegions": []
}

====================================================================
VISUAL MORPHOLOGY DESCRIPTION OBRIGATÓRIO
====================================================================

visualMorphologyDescription deve ser um objeto JSON.
Nunca retornar texto simples.

Preencher obrigatoriamente:
globalView
cellularity
dominantPopulation
nuclearFeatures
cytoplasmicFeatures
populationHeterogeneity
erythrocyteBackground
plateletBackground
criticalNegativeFindings

Descrever apenas estruturas efetivamente observadas.
Não inferir malignidade.
Não inferir blastos sem evidência morfológica inequívoca.
Não deixar campos vazios.

====================================================================
BLOCO O QUE A IA ESTÁ VENDO
====================================================================

Antes de interpretar, classificar ou sugerir hipóteses, descreva literalmente tudo que é visível no campo.

Preencher obrigatoriamente whatAISees.

Não usar linguagem diagnóstica neste bloco.

Descrever:
- aspecto global do campo
- celularidade
- hemácias
- leucócitos visíveis
- plaquetas
- população predominante
- estruturas incomuns
- achados críticos ausentes
- limitações da imagem

O campo freeNarrative deve ser um texto fluido, como um hematologista descrevendo a imagem ao microscópio.

Exemplo de estilo:

"Observa-se campo microscópico com predomínio de hemácias preservadas ao fundo, presença de leucócitos maduros dispersos e pequena quantidade de plaquetas. No centro do campo há estrutura alongada/curvilínea incomum, que se destaca do fundo eritrocitário. Não são observados blastos inequívocos, bastonetes de Auer ou agregados plaquetários evidentes. A interpretação é limitada por campo único e requer correlação com outros campos da lâmina."

====================================================================
ACHADOS POSITIVOS E NEGATIVOS ESTRUTURADOS
====================================================================

Preencher obrigatoriamente:

positiveFindings
negativeFindingsStructured

positiveFindings deve conter apenas achados realmente observados na imagem.

Exemplos:
- Hemácias predominantemente normocíticas e normocrômicas
- Neutrófilos maduros observados
- Linfócitos maduros observados
- Plaquetas presentes e distribuídas
- Célula mononuclear isolada com possível reatividade
- Estrutura incomum observada no campo

negativeFindingsStructured deve conter apenas achados ativamente pesquisados e não evidenciados.

Exemplos:
- Blastos inequívocos não evidenciados
- Bastonetes de Auer não evidenciados
- Esquizócitos relevantes não evidenciados
- Drepanócitos não evidenciados
- Agregados plaquetários não evidenciados
- Plaquetas gigantes não evidenciadas
- Células imaturas críticas não evidenciadas

Não repetir frases longas.
Não usar linguagem diagnóstica.
Não incluir hipóteses clínicas.
Cada item deve ser curto, objetivo e auditável.

====================================================================
RESUMO EXECUTIVO OBRIGATÓRIO
====================================================================

Preencher obrigatoriamente:

executiveSummary.mainFinding
executiveSummary.riskLevel
executiveSummary.confidence
executiveSummary.pattern
executiveSummary.humanReview

Cada campo deve conter no máximo uma frase curta.

Objetivo:
permitir compreensão da análise em menos de 10 segundos.

Não usar diagnóstico definitivo.

Não usar linguagem alarmista.

Usar linguagem objetiva, hospitalar e educacional.

====================================================================
DESCRIÇÃO OBRIGATÓRIA DAS TRÊS SÉRIES HEMATOLÓGICAS
====================================================================

Os campos:

morphologyAnalysis.erythrocyteReview
morphologyAnalysis.leukocyteReview
morphologyAnalysis.plateletReview

devem SEMPRE ser preenchidos.

Nunca retornar string vazia.

Mesmo quando não houver alterações relevantes,
descrever:

- elementos visualizados
- padrão predominante
- principais achados ausentes
- limitações da avaliação

A IA deve obrigatoriamente revisar:

1. Série eritrocitária
2. Série leucocitária
3. Série plaquetária

em toda imagem analisada.

Os campos:

morphologyAnalysis.erythrocyteReview
morphologyAnalysis.leukocyteReview
morphologyAnalysis.plateletReview

devem SEMPRE ser preenchidos.

Nunca retornar string vazia.

====================================================================
TAMANHO MÍNIMO DAS DESCRIÇÕES
====================================================================

morphologyAnalysis.erythrocyteReview:
mínimo 150 caracteres.

Descrever:
- tamanho eritrocitário
- cromia
- anisocitose
- poiquilocitose
- alterações ausentes
- limitações da avaliação

morphologyAnalysis.leukocyteReview:
mínimo 150 caracteres.

Descrever:
- população predominante
- maturação celular
- características nucleares
- características citoplasmáticas
- heterogeneidade populacional
- alterações ausentes

morphologyAnalysis.plateletReview:
mínimo 100 caracteres.

Descrever:
- quantidade aparente
- distribuição
- agregação
- gigantismo plaquetário
- alterações ausentes
- limitações da avaliação

Nunca retornar:

""

ou

"Não avaliado"

ou

"Sem alterações"

sem descrição morfológica complementar.

====================================================================
RACIOCÍNIO MORFOLÓGICO OBRIGATÓRIO
====================================================================

A IA deve obrigatoriamente explicar:

1. O que visualmente foi identificado.

2. Quais características sustentam a classificação celular.

3. Quais características afastam outras hipóteses.

4. Se existe heterogeneidade populacional.

5. Se existe monomorfismo populacional.

6. Se existe maturação preservada.

7. Se existe padrão reacional.

8. Se existe padrão suspeito para neoplasia hematológica.

9. Grau de confiança de cada inferência.

10. Limitações da imagem.

A conclusão final deve ser baseada apenas em estruturas realmente observadas.

Nunca inferir blastos, plasmoblastos ou malignidade sem evidências morfológicas inequívocas.

====================================================================
REGRAS OBRIGATÓRIAS PARA O OBJETO findings
====================================================================

Os campos do objeto findings são obrigatórios.

NÃO deixar todos como false automaticamente.

Cada campo deve refletir a avaliação morfológica real da imagem.

Se houver células mononucleares grandes:
largeMononuclearCells = true

Se houver células plasmocitoides:
plasmacytoidCells = true

Se houver plasmócitos identificáveis:
plasmocytes = true

Se houver plasmoblastos suspeitos:
plasmablasts = true

Se houver linfócitos atípicos:
atypicalLymphocytes = true

Se houver população monomórfica:
monomorphicPopulation = true

Se houver células imaturas:
immatureCells = true

Se houver suspeita morfológica de blastos:
blastSuspicion = true

====================================================================
BLOQUEIO DE NORMALIDADE
====================================================================

Se qualquer um dos seguintes campos for true:

- largeMononuclearCells
- reactiveLymphocytes
- atypicalLymphocytes
- plasmacytoidCells
- plasmocytes
- plasmablasts
- monomorphicPopulation
- immatureCells
- blastSuspicion

Então:

normalityBlocked = true

Adicionar justificativa específica em blockNormalReason.

morphologicRiskClass não pode ser CLASS_0_NORMAL.

====================================================================
CLASSIFICAÇÃO DE RISCO
====================================================================

Se houver apenas célula mononuclear grande isolada,
linfócito reativo isolado ou linfócito atípico isolado,
sem evidência de população sustentada:

CLASS_1_LIMITED_FIELD_ATYPICAL_CELL

Se houver população celular atípica sustentada,
repetição de células semelhantes,
padrão reacional amplo ou múltiplas células atípicas:

CLASS_2_ATYPICAL_POPULATION

Se houver população monomórfica,
predomínio plasmocitoide,
plasmócitos numerosos,
plasmoblastos suspeitos
ou padrão sugestivo de clonalidade:

CLASS_3_POSSIBLE_CLONALITY

Se houver critérios morfológicos convincentes de blastos:

CLASS_4_BLAST_SUSPICION

Nunca retornar CLASS_0_NORMAL quando houver população atípica,
plasmocitoide, monomórfica, imatura ou suspeita blástica.
====================================================================
ESTILO
====================================================================

Utilizar:
- linguagem hospitalar
- linguagem acadêmica
- terminologia hematológica real
- descrição objetiva
- segurança clínica máxima

====================================================================
PRINCÍPIO FUNDAMENTAL
====================================================================

NUNCA CONCLUIR ALÉM DA EVIDÊNCIA VISUAL DISPONÍVEL.

PRIORIZE SEGURANÇA CLÍNICA SOBRE SENSACIONALISMO.

`;

// ============================================================================
// OPENAI ANALYSIS
// ============================================================================

// ============================================================================
// OPENAI MULTI-STAGE ANALYSIS V7
// ============================================================================

async function analyzeWithOpenAI({
  images,
  analysisSource = "ai_visual",
  manualCounts = {},
}) {
  const requestId = generateRequestId();
  const pipelineStart = performance.now();

  try {
    const imageStart = performance.now();
    const imagesPayload = [];
    const imageMetadata = [];

    for (const file of images) {
      const enhanced = await enhanceMicroscopyImage(file.buffer);
      if (enhanced?.metadata) {
        imageMetadata.push(enhanced.metadata);
      }

      const payload = buildGPTImagePayload(enhanced, "image/jpeg", {
        maxTiles: Number(process.env.GPT_IMAGE_TILES || 1),
      });

      imagesPayload.push(...payload);
    }

    const imageTiming = logStep(requestId, "IMAGE ENHANCEMENT TURBO", imageStart);

    const manualMetadata = buildSafeManualMetadata({
      analysisSource,
      manualCounts,
    });

    const contextualPrompt = `
ANALYSIS SOURCE: ${analysisSource}
MANUAL COUNTS: ${JSON.stringify(manualCounts)}

MODOS DE ANÁLISE:

ai_visual:
- Super IA independente.
- Avaliar exclusivamente a imagem enviada.
- Não exigir contagem diferencial.
- Não gerar erro por ausência de valores manuais.
- Focar em morfologia celular e qualidade da lâmina.

hybrid:
- Super IA + calculadora diferencial.
- Integrar achados visuais com os valores informados.
- Diferenciar claramente:
  achado observado pela IA
  versus
  dado informado pelo usuário.

manual:
- Dados inseridos pelo usuário.
- Não assumir que representam achados visuais.

REGRA PRINCIPAL:
A calculadora diferencial é opcional.
A Super IA deve funcionar completamente sem ela.

Execute o pipeline completo em UMA resposta JSON única, preservando:
imageQuality, visualExtraction, whatAISees, positiveFindings, negativeFindingsStructured, executiveSummary, morphologyAnalysis, visualEvidence,
erythrocyteFindings, leukocyteFindings, plateletFindings, blastSuspicion,
overallAssessment, structuredReport, possibleClinicalCorrelations,
associatedEducationalHypotheses, clinicalCorrelationNeeds, clinicalMeaning,
educationalImpact, interpretiveSynthesis, hematologicReasoning,
visualMorphologyDescription, cellMorphology, populationPatternAnalysis,
negativeFindings.
`;

const compactHospitalPrompt = `
Você é uma IA hematológica educacional especializada em morfologia de sangue periférico.

Você deve raciocinar como um hematologista com experiência em hematologia clínica, citomorfologia e hematopatologia.

Sua primeira responsabilidade NÃO é classificar.

Sua primeira responsabilidade é OBSERVAR.

Antes de interpretar qualquer achado:

1. Descreva o campo microscópico.
2. Descreva a celularidade.
3. Descreva a população predominante.
4. Descreva heterogeneidade ou monomorfismo.
5. Descreva características nucleares.
6. Descreva características citoplasmáticas.
7. Descreva o fundo eritrocitário.
8. Descreva a representatividade plaquetária.

Somente depois realize interpretação hematológica.

Nunca iniciar a análise pela conclusão.

Sempre iniciar pela observação morfológica.

Responda SOMENTE JSON válido em português do Brasil.

    Nunca emitir diagnóstico definitivo.
    Nunca confirmar leucemia, linfoma, neoplasia ou malignidade.
    Usar linguagem segura: possível, sugestivo, pode estar associado, requer correlação.

    Nunca chamar de normal se houver:
    linfócito reativo, linfócito atípico, célula mononuclear grande, célula imatura, plasmocitoide, plasmócito, plasmoblasto, monomorfismo ou suspeita blástica.

    Se houver sinal reacional/atípico:
    normalityBlocked=true.

    Se houver apenas célula mononuclear/linfócito atípico isolado:
    morphologicRiskClass="CLASS_1_LIMITED_FIELD_ATYPICAL_CELL".
    reactiveLymphocytePattern="isolated_cell".
    Não usar termos populacionais como linfocitose, ativação linfoide populacional ou padrão mononucleósico.

    Se houver população linfoide reacional sustentada:
    morphologicRiskClass="CLASS_2_ATYPICAL_POPULATION".
    reactiveLymphocytePattern="population_pattern".

    Se houver suspeita blástica:
    morphologicRiskClass="CLASS_4_BLAST_SUSPICION".

    CLASSIFICAÇÃO DE LINFÓCITOS REATIVOS / ATÍPICOS:

    1. REACTIVE_LYMPHOCYTE_TYPICAL:
    citoplasma amplo, basofilia periférica, bordas irregulares, moldagem às hemácias, núcleo maduro, sem nucléolo evidente.

    2. DOWNEY_TYPE_I:
    linfócito pequeno a médio, citoplasma discretamente basofílico, núcleo relativamente maduro, reatividade discreta.

    3. DOWNEY_TYPE_II:
    célula grande, citoplasma abundante, basofilia intensa, contorno citoplasmático irregular, moldagem às hemácias, núcleo oval ou irregular.

    4. DOWNEY_TYPE_III_IMMUNOBLASTOID:
    célula grande, citoplasma basofílico, núcleo grande, cromatina mais frouxa, nucléolo possível. Pode simular blasto, mas não confirmar blasto sem critérios inequívocos.

    5. PLASMACYTOID_LYMPHOCYTE:
    citoplasma intensamente basofílico, núcleo excêntrico, halo perinuclear possível, aspecto intermediário entre linfócito e plasmócito.

    6. ATYPICAL_LYMPHOCYTE_UNCLASSIFIED:
    célula mononuclear atípica sem elementos suficientes para subtipo seguro, especialmente em campo limitado.

    DIFERENCIAÇÃO CONTRA BLASTO:
    Só marcar blastSuspicion=true se houver conjunto convincente:
    alta relação núcleo/citoplasma, cromatina frouxa, nucléolos evidentes, contorno nuclear imaturo e ausência de maturação.
    Na dúvida, marcar blastSuspicion=false e usar ATYPICAL_LYMPHOCYTE_UNCLASSIFIED.

    Avaliar:
    1. Qualidade da imagem.

    DESCRIÇÃO MORFOLÓGICA OBRIGATÓRIA

    A IA deve produzir uma descrição semelhante à de um hematologista observando a lâmina.

    Responder obrigatoriamente:

    - Como o campo se apresenta globalmente.
    - Se há hipercelularidade ou hipocelularidade relativa.
    - Qual população domina o campo.
    - Se existe diversidade celular.
    - Se existe repetição de um mesmo tipo celular.
    - Se existe monomorfismo.
    - Se existe heterogeneidade.
    - Como se apresentam os núcleos.
    - Como se apresenta a cromatina.
    - Como se apresenta o citoplasma.
    - Como se apresenta o fundo eritrocitário.
    - Como se apresentam as plaquetas.

    Evitar conclusões precoces.

    Primeiro descrever.
    Depois interpretar.

    2. Eritrócitos: tamanho, cor, anisocitose, poiquilocitose, esquizócitos.
    3. Leucócitos: neutrófilos, linfócitos, monócitos, células reativas, atípicas ou imaturas.
    4. Plaquetas: quantidade, agregados, gigantismo.
    5. Elementos de alerta não evidenciados.

    ELEMENTOS DE ALERTA NÃO EVIDENCIADOS:
    Blastos inequívocos; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.

    Retorne obrigatoriamente JSON com:

    whatAISees contendo obrigatoriamente:
    - globalField
    - cellularity
    - erythrocytes
    - leukocytes
    - platelets
    - dominantFinding
    - unusualStructures
    - negativeFindings
    - imageLimitations
    - freeNarrative

    positiveFindings,
    negativeFindingsStructured,

    imageQuality,
    visualExtraction,
    normalityBlocked,
    blockNormalReason,
    morphologicRiskClass,
    reactiveLymphocytePattern,
    findings,
    visualEvidence,

    morphologyAnalysis contendo obrigatoriamente:
    - visualMorphologyDescription
    - cellMorphology
    - populationPatternAnalysis
    - negativeFindings
    - overview
    - erythrocyteReview
    - leukocyteReview
    - plateletReview
    - biologicalInterpretation
    - differentialDiagnosis
    - summary

    patternRecognition,
    interpretiveSynthesis,
    clinicalMeaning,

    hematologicReasoning em 4 camadas:
    - whatISee
    - whatItResembles
    - whatICannotConfirm
    - finalInterpretation

    educationalImpact,
    overallAssessment,
    structuredReport.

    Quando houver linfócito reativo, linfócito atípico,
    célula mononuclear grande, célula plasmocitoide
    ou imunoblastoide, preencher visualEvidence com:

    {
      "cellSizeIncrease": false,
      "abundantBasophilicCytoplasm": false,
      "erythrocyteMolding": false,
      "irregularCellBorders": false,
      "eccentricNucleus": false,
      "prominentNucleolus": false
    }

    REGRAS DE NARRATIVA

    Não repetir continuamente:

    "população celular atípica"
    "população mononuclear atípica"
    "requer correlação"
    "morfologia preservada"
    "padrão reacional"

    Cada seção deve acrescentar informação nova.

    Se uma informação já foi descrita:

    não repetir a mesma frase.

    Substituir repetição por aprofundamento.

    Ruim:

    "População celular atípica."
    "População celular atípica."
    "População celular atípica."

    Bom:

    "Predomínio de células mononucleares."
    "Relativa uniformidade morfológica."
    "Cromatina discretamente frouxa."
    "Ausência de critérios inequívocos de blasto."

    Cada parágrafo deve acrescentar conhecimento.

    Marcar true apenas quando houver evidência visual observável.
    Nunca inferir características não visualizadas.

    Dentro de findings incluir obrigatoriamente:
    reactiveLymphocytes, atypicalLymphocytes, largeMononuclearCells, atypicalLymphocyteSubtype, downeyLikeCells, downeyType, plasmacytoidCells, plasmocytes, plasmablasts, monomorphicPopulation, immatureCells, blastSuspicion.

    Valores aceitos para atypicalLymphocyteSubtype:
    none, REACTIVE_LYMPHOCYTE_TYPICAL, DOWNEY_TYPE_I, DOWNEY_TYPE_II, DOWNEY_TYPE_III_IMMUNOBLASTOID, PLASMACYTOID_LYMPHOCYTE, ATYPICAL_LYMPHOCYTE_UNCLASSIFIED.

    Sempre escrever interpretiveSynthesis, clinicalMeaning, hematologicReasoning e educationalImpact em português do Brasil.

    ESTILO DE ESPECIALISTA

    A descrição deve parecer escrita por um hematologista experiente.

    Priorizar:

    - observação morfológica
    - raciocínio biológico
    - limitações do campo
    - diferenciais morfológicos

    Não agir como classificador automático.

    Agir como observador microscópico.

    Sempre responder:

    1. O que vejo.
    2. O que isso sugere.
    3. O que isso NÃO permite concluir.
    4. O que seria necessário para confirmar.

    A qualidade da descrição é mais importante do que a classificação.

    Evitar respostas curtas.

    Evitar respostas genéricas.

    Produzir descrições morfológicas ricas, detalhadas e educacionais.

    `;

    console.log("================================");
    console.log("PROMPT SIZE");
    console.log(
      JSON.stringify({
        contextualPromptLength: contextualPrompt.length,
        compactHospitalPromptLength: compactHospitalPrompt.length,
        imagesPayloadLength: imagesPayload.length,
      }, null, 2)
    );
    console.log("================================");

    const visualStart = performance.now();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.12,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: compactHospitalPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: contextualPrompt },
            ...imagesPayload,
          ],
        },
      ],
    });

    const visualTiming = logStep(
      requestId,
      "OPENAI TURBO ANALYSIS",
      visualStart,
    );

    const parsed = safeJsonParse(
      completion?.choices?.[0]?.message?.content || "{}",
    );

    parsed.visualEvidence =
      parsed.visualEvidence || {};

    parsed.visualEvidence.cellSizeIncrease ??= false;
    parsed.visualEvidence.abundantBasophilicCytoplasm ??= false;
    parsed.visualEvidence.erythrocyteMolding ??= false;
    parsed.visualEvidence.irregularCellBorders ??= false;
    parsed.visualEvidence.eccentricNucleus ??= false;
    parsed.visualEvidence.prominentNucleolus ??= false;

    if (
      typeof parsed.visualEvidence === "string"
    ) {
      parsed.visualEvidence = {
        visualEvidenceScore: 65,
        imageReliability: "moderate",
        artifactInterference: "low",
        evidenceLevel: "moderada evidência visual",
      };
    }

    parsed.heatmapRegions =
      Array.isArray(parsed.heatmapRegions)
        ? parsed.heatmapRegions.filter(
            (region) =>
              region &&
              typeof region === "object" &&
              !Array.isArray(region),
          )
        : [];

    console.log("================================");
    console.log("RAW GPT RESPONSE");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("================================");

    let mergedAnalysis = normalizeMedicalResponse({
      ...parsed,
      analysisSource,
      manualCounts,
      manualMetadata,
    });

    mergedAnalysis =
      applyFieldAdequacyRules(
        mergedAnalysis,
      );

    mergedAnalysis =
      sanitizeNarrativeRepetition(
        mergedAnalysis,
      );

    const globalPattern =
      analyzeGlobalPattern(
        mergedAnalysis,
      );

    mergedAnalysis.globalPattern =
      globalPattern;

    mergedAnalysis.morphologyAnalysis =
      mergedAnalysis.morphologyAnalysis || {};

    if (
      typeof mergedAnalysis.morphologyAnalysis
        ?.visualMorphologyDescription === 'string'
    ) {

      mergedAnalysis.morphologyAnalysis
        .visualMorphologyDescription = {

        globalView:
          mergedAnalysis.morphologyAnalysis
            .visualMorphologyDescription,

        dominantPopulation: '',

        cellularity: '',

        nuclearFeatures: '',

        cytoplasmicFeatures: '',

        populationHeterogeneity: '',

        erythrocyteBackground: '',

        plateletBackground: '',

        criticalNegativeFindings: '',

        overallImpression: '',
      };
    }

    mergedAnalysis.morphologyAnalysis.visualMorphologyDescription =
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription || {

        globalView:
          'Campo microscópico avaliado com descrição global limitada pela resposta visual disponível.',

        dominantPopulation:
          mergedAnalysis.globalPattern?.dominantPattern ||
          'Não definida',

        cellularity:
          'Celularidade estimada a partir do campo analisado.',

        nuclearFeatures: '',

        cytoplasmicFeatures: '',

        populationHeterogeneity: '',

        erythrocyteBackground: '',

        plateletBackground: '',

        criticalNegativeFindings: '',

        overallImpression:
          mergedAnalysis.globalPattern?.globalSummary ||
          'Requer correlação com múltiplos campos.',
      };

    const existingVisualDescription =
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription;

    const hasValidVisualDescription =
      existingVisualDescription &&
      typeof existingVisualDescription === "object" &&
      Object.values(existingVisualDescription).some(
        (value) => String(value || "").trim().length > 0,
      );

    if (!hasValidVisualDescription) {
      mergedAnalysis.morphologyAnalysis.visualMorphologyDescription = {
        globalView:
          mergedAnalysis.whatAISees?.globalField ||
          "Campo microscópico avaliado com descrição global limitada pela resposta visual disponível.",

        dominantPopulation:
          mergedAnalysis.whatAISees?.dominantFinding ||
          mergedAnalysis.globalPattern?.dominantPattern ||
          "Não definida",

        cellularity:
          mergedAnalysis.whatAISees?.cellularity ||
          "Celularidade estimada a partir do campo analisado.",

        nuclearFeatures: "",

        cytoplasmicFeatures: "",

        populationHeterogeneity: "",

        erythrocyteBackground:
          mergedAnalysis.whatAISees?.erythrocytes || "",

        plateletBackground:
          mergedAnalysis.whatAISees?.platelets || "",

        criticalNegativeFindings:
          mergedAnalysis.whatAISees?.negativeFindings || "",

        overallImpression:
          mergedAnalysis.whatAISees?.freeNarrative ||
          mergedAnalysis.globalPattern?.globalSummary ||
          "Requer correlação com múltiplos campos.",
      };
    }

    console.log("================================");
    console.log("GLOBAL PATTERN");
    console.log(JSON.stringify(globalPattern, null, 2));
    console.log("================================");

    console.log("================================");
    console.log("NORMALIZED RESPONSE");
    console.log("FIELD ADEQUACY");
    console.log(
      JSON.stringify(
        mergedAnalysis.fieldAdequacy,
        null,
        2,
      ),
    );
    console.log(JSON.stringify(mergedAnalysis, null, 2));
    console.log("================================");
    console.log("MORPHOLOGY ANALYSIS");
    console.log(
      JSON.stringify(
        mergedAnalysis.morphologyAnalysis,
        null,
        2,
      ),
    );
    console.log("================================");

    console.log("🔥 NORMALIZED RESPONSE:");
    console.log(
      JSON.stringify(
        {
          morphologyAnalysis: mergedAnalysis.morphologyAnalysis,
          patternRecognition: mergedAnalysis.patternRecognition,
          structuredReport: mergedAnalysis.structuredReport,
          overallAssessment: mergedAnalysis.overallAssessment,
          interpretiveSynthesis: mergedAnalysis.interpretiveSynthesis,
          clinicalMeaning: mergedAnalysis.clinicalMeaning,
          hematologicReasoning: mergedAnalysis.hematologicReasoning,
        },
        null,
        2,
      ),
    );

    // Campos avançados sempre presentes para evitar cards vazios no Flutter.
    mergedAnalysis.possibleClinicalCorrelations =
      Array.isArray(mergedAnalysis.possibleClinicalCorrelations) &&
      mergedAnalysis.possibleClinicalCorrelations.length > 0
        ? mergedAnalysis.possibleClinicalCorrelations
        : [
            "Correlação com hemograma completo e revisão microscópica profissional.",
            "Padrão morfológico indeterminado quando o campo for limitado.",
            "Necessidade de avaliar múltiplos campos antes de inferir padrão reacional ou clonal.",
            "Achados devem ser interpretados conforme distribuição, repetição celular e contexto clínico.",
          ]


    mergedAnalysis.associatedEducationalHypotheses =
      Array.isArray(mergedAnalysis.associatedEducationalHypotheses) &&
      mergedAnalysis.associatedEducationalHypotheses.length > 0
        ? mergedAnalysis.associatedEducationalHypotheses
        : [
            "Hipótese morfológica indeterminada dependente de correlação com hemograma.",
            "Possível alteração reacional ou atípica, conforme repetição em múltiplos campos.",
            "Necessidade de distinguir achado isolado de população celular sustentada.",
            "Possíveis respostas adaptativas da medula óssea conforme contexto clínico-laboratorial.",
            "Limitação por imagem isolada, artefatos ou representatividade do campo.",
          ];


    mergedAnalysis.clinicalCorrelationNeeds = Array.isArray(mergedAnalysis.clinicalCorrelationNeeds)
      ? mergedAnalysis.clinicalCorrelationNeeds
      : ["Hemograma completo", "Quadro clínico", "Revisão microscópica profissional"];
    mergedAnalysis.clinicalMeaning =
      mergedAnalysis.clinicalMeaning ||
      mergedAnalysis.clinicalCorrelation?.summary ||
      mergedAnalysis.overallAssessment?.recommendedCorrelation ||
      "Os achados morfológicos identificados devem ser interpretados considerando sua relevância biológica. Alterações celulares podem refletir respostas fisiológicas, processos reacionais ou outras condições hematológicas que necessitam avaliação conjunta com hemograma completo, parâmetros quantitativos, histórico clínico e revisão microscópica profissional.";

    mergedAnalysis.interpretiveSynthesis =
      mergedAnalysis.interpretiveSynthesis ||
      mergedAnalysis.structuredReport?.morphologySummary ||
      mergedAnalysis.structuredReport?.plainTextReport ||
      mergedAnalysis.leukocyteFindings?.summary ||
      mergedAnalysis.erythrocyteFindings?.summary ||
      mergedAnalysis.overallAssessment?.mainImpression ||
      "A avaliação morfológica digital descreve características celulares observáveis na imagem analisada, incluindo padrões de maturação, alterações nucleares, citoplasmáticas e distribuição celular. A interpretação deve considerar qualidade da amostra, limitações técnicas e correlação com dados laboratoriais complementares.";
    mergedAnalysis.hematologicReasoning =
      mergedAnalysis.hematologicReasoning ||
      "A avaliação hematológica considera inicialmente a linhagem celular predominante, características nucleares, padrão de cromatina, relação núcleo/citoplasma, alterações citoplasmáticas e maturação celular. Esses elementos auxiliam na diferenciação entre padrões reacionais, fisiológicos ou alterações que necessitam investigação complementar. A análise digital deve sempre ser correlacionada com hemograma completo, histórico clínico e revisão microscópica profissional.";

    mergedAnalysis =
      applyLimitedFieldFinalLock(
        mergedAnalysis,
      );

    const extractedText =
      buildSemanticText({
        ...mergedAnalysis,
        rawResponse:
          mergedAnalysis.rawResponse || {},

        rawResponseText:
          JSON.stringify(
            mergedAnalysis.rawResponse || {},
          ),
      });

// ============================================================================
// SAFE SEMANTIC FINDINGS — não promove achados críticos por texto livre
// ============================================================================

const rawFindings =
  mergedAnalysis.rawResponse?.findings ||
  mergedAnalysis.rawResponse?.positiveFindings ||
  {};

const safeSemanticFindings = {
  largeMononuclearCells:
    rawFindings.largeMononuclearCells === true &&
    mergedAnalysis.fieldAdequacy?.visibleLeukocytes >= 8,

  reactiveLymphocytes:
    rawFindings.reactiveLymphocytes === true &&
    mergedAnalysis.fieldAdequacy?.visibleLeukocytes >= 4,

  atypicalLymphocytes:
    rawFindings.atypicalLymphocytes === true &&
    mergedAnalysis.fieldAdequacy?.visibleLeukocytes >= 4,

  plasmacytoidCells:
    rawFindings.plasmacytoidCells === true &&
    mergedAnalysis.fieldAdequacy?.visibleLeukocytes >= 8,

  plasmocytes:
    rawFindings.plasmocytes === true &&
    mergedAnalysis.fieldAdequacy?.visibleLeukocytes >= 8,

  plasmablasts:
    rawFindings.plasmablasts === true &&
    rawFindings.blastSuspicion === true,

  monomorphicPopulation:
    rawFindings.monomorphicPopulation === true &&
    mergedAnalysis.fieldAdequacy?.adequateForPopulationAssessment === true,

  blastSuspicion:
    rawFindings.blastSuspicion === true,
};

console.log(
  'SEMANTIC FINDINGS',
  JSON.stringify(safeSemanticFindings, null, 2),
);

mergedAnalysis.findings = {
  ...mergedAnalysis.findings,

  largeMononuclearCells:
    safeSemanticFindings.largeMononuclearCells,

  reactiveLymphocytes:
    safeSemanticFindings.reactiveLymphocytes,

  atypicalLymphocytes:
    safeSemanticFindings.atypicalLymphocytes,

  plasmacytoidCells:
    safeSemanticFindings.plasmacytoidCells,

  plasmocytes:
    safeSemanticFindings.plasmocytes,

  plasmablasts:
    safeSemanticFindings.plasmablasts,

  monomorphicPopulation:
    safeSemanticFindings.monomorphicPopulation,

  blastSuspicion:
    safeSemanticFindings.blastSuspicion,
};

// ============================================================================
// ANTI FALSE NORMAL — REACTIVE / ATYPICAL LYMPHOID GATE
// ============================================================================

const hasReactiveOrAtypicalSignal =
  mergedAnalysis.findings?.reactiveLymphocytes === true ||
  mergedAnalysis.findings?.atypicalLymphocytes === true ||
  mergedAnalysis.findings?.largeMononuclearCells === true ||
  mergedAnalysis.findings?.monocytoidAtypicalLymphocytes === true ||
  mergedAnalysis.findings?.downeyLikeCells === true ||
  /linf[oó]cito reativo|linf[oó]citos reativos|c[eé]lula mononuclear isolada|atipia\/reatividade|reatividade/i
    .test(extractedText);

if (hasReactiveOrAtypicalSignal) {
  mergedAnalysis.normalityBlocked = true;

  mergedAnalysis.morphologicRiskClass =
    mergedAnalysis.morphologicRiskClass === "CLASS_0_NORMAL"
      ? "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL"
      : mergedAnalysis.morphologicRiskClass;

  mergedAnalysis.riskLevel =
    "Achado celular isolado / possível reatividade linfoide";

  mergedAnalysis.blockNormalReason =
    Array.isArray(mergedAnalysis.blockNormalReason)
      ? mergedAnalysis.blockNormalReason
      : [];

  mergedAnalysis.blockNormalReason.push(
    "Célula mononuclear isolada com possível reatividade/atipia impede classificação como morfologia preservada."
  );

  mergedAnalysis.blockNormalReason = [
    ...new Set(mergedAnalysis.blockNormalReason),
  ];

  mergedAnalysis.overallAssessment =
    mergedAnalysis.overallAssessment || {};

  mergedAnalysis.overallAssessment.requiresHumanReview = true;

  mergedAnalysis.overallAssessment.riskCategory =
    mergedAnalysis.morphologicRiskClass;

  mergedAnalysis.overallAssessment.mainImpression =
    "Campo limitado para caracterização leucocitária conclusiva. Há célula mononuclear isolada com possível aspecto reacional/atípico, sem critérios para blastos inequívocos ou população monomórfica neste campo.";

  mergedAnalysis.interpretiveSynthesis =
    "A imagem demonstra campo limitado com célula mononuclear isolada de possível reatividade/atipia. Esse padrão não permite afirmar ativação linfoide populacional, mas também não deve ser classificado como morfologia preservada. A interpretação deve permanecer conservadora, sem inferir processo neoplásico, e requer correlação com hemograma completo e avaliação de múltiplos campos.";

  mergedAnalysis.clinicalMeaning =
    "A presença de célula mononuclear isolada com possível reatividade pode representar resposta imunológica inespecífica, especialmente quando não há blastos, bastonetes de Auer ou células imaturas críticas. Por se tratar de campo limitado, o significado hematológico depende da frequência desse padrão em outros campos, dos dados do hemograma e do contexto clínico.";

  mergedAnalysis.hematologicReasoning =
    "O raciocínio hematológico deve diferenciar uma célula mononuclear reacional isolada de uma população atípica sustentada. Neste campo não há elementos suficientes para caracterizar população linfoide atípica, monomorfismo ou suspeita blástica. Ainda assim, a identificação de possível reatividade impede a conclusão de morfologia plenamente preservada e justifica recomendação de correlação microscópica e hematimétrica.";
}

    const engineStart = performance.now();
    const [erythrocyteAnalysis, leukocyteAnalysis, plateletAnalysis] = await Promise.all([
      analyzeErythrocytes(extractedText),
      analyzeLeukocytes(extractedText),
      analyzePlatelets(extractedText),
    ]);
    const engineTiming = logStep(requestId, "HEMATOLOGY ENGINES", engineStart);

    const safetyStart = performance.now();
    const safetyValidation = validateHematologyAnalysis({
      analysis: mergedAnalysis,
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation: {},
      confidenceAnalysis: {},
      analysisSource,
    });
    const safetyTiming = logStep(requestId, "SAFETY ENGINE", safetyStart);

    const consensusStart = performance.now();
    const consensusAnalysis = buildHematologyConsensus({
      analysis: mergedAnalysis,
      leukocyteAnalysis,
      erythrocyteAnalysis,
      plateletAnalysis,
      confidenceAnalysis: {},
      diagnosticCorrelation: {},
      safetyValidation,
      analysisSource,
    });
    const consensusTiming = logStep(requestId, "CONSENSUS ENGINE", consensusStart);

    let diagnosticCorrelation = buildDiagnosticCorrelation({
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      consensusAnalysis,
      analysisSource,
    });

    if (safetyValidation?.safeDiagnosticGate === true && process.env.ENABLE_ADVANCED_CORRELATION === "true") {
      try {
        const advancedCorrelation = await Promise.race([
          correlateHematology({
            manualMetadata,
            extractedText,
            visualExtraction: mergedAnalysis.visualExtraction || {},
            morphologyAnalysis: mergedAnalysis.morphologyAnalysis || {},
            evidenceAnalysis: mergedAnalysis.visualEvidence || {},
            erythrocyteAnalysis,
            leukocyteAnalysis,
            plateletAnalysis,
            consensusAnalysis,
            analysisSource,
          }),
          new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 8000)),
        ]);
        diagnosticCorrelation = { ...diagnosticCorrelation, advancedCorrelation };
      } catch (error) {
        diagnosticCorrelation = {
          ...diagnosticCorrelation,
          advancedCorrelation: { skipped: true, reason: error.message },
        };
      }
    }

    const reactiveLymphocyteAnalysis =
      calculateReactiveLymphocyteScore({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.reactiveLymphocyteAnalysis =
      reactiveLymphocyteAnalysis;

    const blastMimicAnalysis =
      calculateBlastMimicRisk({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.blastMimicAnalysis =
      blastMimicAnalysis;

    const antiOvercallingAnalysis =
      applyAntiOvercallingRules({
        findings: mergedAnalysis.findings || {},
        reactiveLymphocyteAnalysis,
        blastMimicAnalysis,
        visualEvidence: mergedAnalysis.visualEvidence || {},
      });

    mergedAnalysis.findings =
      antiOvercallingAnalysis.adjustedFindings;

    mergedAnalysis.antiOvercallingAnalysis =
      antiOvercallingAnalysis;

// ============================================================================
// PLASMABLAST / MONOMORPHISM SAFETY LOCK
// ============================================================================

if (
  mergedAnalysis.findings?.plasmablasts === true &&
  mergedAnalysis.findings?.monomorphicPopulation !== true &&
  mergedAnalysis.findings?.blastSuspicion !== true
) {
  mergedAnalysis.findings.plasmablasts = false;

  mergedAnalysis.morphologicRiskClass =
    "CLASS_2_REACTIVE_MONONUCLEOSIS_PATTERN";

  mergedAnalysis.riskLevel =
    "Padrão reacional/atípico sem evidência de população blástica";

  mergedAnalysis.blockNormalReason =
    Array.isArray(mergedAnalysis.blockNormalReason)
      ? mergedAnalysis.blockNormalReason
      : [];

  mergedAnalysis.blockNormalReason.push(
    "Plasmoblasto não sustentado por monomorfismo ou suspeita blástica inequívoca."
  );

  mergedAnalysis.blockNormalReason =
    [...new Set(mergedAnalysis.blockNormalReason)];
}

    const lymphoidPatternAnalysis =
      classifyLymphoidPattern({
        findings: mergedAnalysis.findings || {},
        visualEvidence: mergedAnalysis.visualEvidence || {},
        fieldAdequacy: mergedAnalysis.fieldAdequacy || {},
      });

    mergedAnalysis.lymphoidPatternAnalysis =
      lymphoidPatternAnalysis;

    if (
      lymphoidPatternAnalysis.forceDowngrade === true
    ) {
      mergedAnalysis.findings.monomorphicPopulation = false;

      if (
        mergedAnalysis.morphologicRiskClass ===
          "CLASS_5_HIGH_NEOPLASTIC_SUSPICION" ||
        mergedAnalysis.morphologicRiskClass ===
          "CLASS_3_POSSIBLE_CLONALITY"
      ) {
        mergedAnalysis.morphologicRiskClass =
          lymphoidPatternAnalysis.riskCeiling;
      }

      mergedAnalysis.riskLevel =
        "Padrão linfoide atípico/indeterminado com necessidade de correlação";

      mergedAnalysis.overallAssessment =
        mergedAnalysis.overallAssessment || {};

      mergedAnalysis.overallAssessment.requiresHumanReview = true;

      mergedAnalysis.overallAssessment.riskCategory =
        mergedAnalysis.morphologicRiskClass;
    }

    const confidenceStart = performance.now();

    console.log(
      "VISUAL EVIDENCE CHECK",
      JSON.stringify(
        {
          raw: mergedAnalysis?.rawResponse?.visualEvidence,
          normalized: mergedAnalysis?.visualEvidence,
        },
        null,
        2,
      ),
    );

    const confidenceAnalysis = buildConfidenceAnalysis({
      analysis: mergedAnalysis,

      visualEvidence:
        mergedAnalysis.visualEvidence ||
        mergedAnalysis.rawResponse?.visualEvidence ||
        {},

      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation,
      consensusResult: consensusAnalysis,
      analysisSource,
    });
    const confidenceTiming = logStep(requestId, "CONFIDENCE ENGINE", confidenceStart);

    let finalStructuredReport = mergedAnalysis?.structuredReport || {};

    const riskClass =
      mergedAnalysis?.morphologicRiskClass || '';

    finalStructuredReport = {
      ...finalStructuredReport,

      conclusion:
        mergedAnalysis?.overallAssessment?.mainImpression ||
        mergedAnalysis?.riskLevel ||
        'Achado hematológico inespecífico.',

      hematologicMeaning:
        mergedAnalysis?.clinicalMeaning ||
        'A interpretação depende de correlação clínico-laboratorial.',

      recommendation:
        mergedAnalysis?.overallAssessment
          ?.recommendedCorrelation ||
        'Correlacionar com hemograma completo e avaliação microscópica profissional.',
    };

    const currentRiskClass =
      mergedAnalysis?.morphologicRiskClass || '';

    if (
      currentRiskClass ===
      'CLASS_1_LIMITED_FIELD_ATYPICAL_CELL'
    ) {
      finalStructuredReport = {
        ...finalStructuredReport,

        conclusion:
          'Campo microscópico limitado com célula mononuclear isolada de possível natureza reacional. Não foram observados elementos inequívocos de blastos ou população neoplásica neste campo analisado.',

        hematologicMeaning:
          'Achado focal e isolado, insuficiente para caracterização de processo proliferativo. Recomenda-se correlação clínica e avaliação de múltiplos campos da lâmina.',

        recommendation:
          'Correlacionar com hemograma completo, quadro clínico e revisão microscópica profissional.',
      };
    }

    if (!safetyValidation?.safeDiagnosticGate) {
      finalStructuredReport = {
        ...finalStructuredReport,
        recommendation: finalStructuredReport?.recommendation ||
          "Revisão microscópica manual recomendada.",
      };

      mergedAnalysis.overallAssessment = {
        ...(mergedAnalysis.overallAssessment || {}),
        requiresHumanReview: true,
        safeMode: true,
        recommendedCorrelation:
          mergedAnalysis.overallAssessment?.recommendedCorrelation ||
          "Correlação hematológica presencial recomendada.",
      };
    }

    const totalPipelineTime = logStep(requestId, "TOTAL PIPELINE TURBO", pipelineStart);

    return {

      ...mergedAnalysis,
      structuredReport: finalStructuredReport,
      manualMetadata,
      extractedText,
      erythrocyteAnalysis,
      leukocyteAnalysis,
      plateletAnalysis,
      diagnosticCorrelation,
      confidenceAnalysis,
      reactiveLymphocyteAnalysis,
      blastMimicAnalysis,
      antiOvercallingAnalysis,
      lymphoidPatternAnalysis,
      consensusAnalysis,
      safetyValidation,
      pipeline: {
        version: "V8_TURBO_ENTERPRISE",
        source: analysisSource,
        multiStagePipeline: true,
        turboSingleOpenAICall: true,
        visualExtraction: true,
        morphologyValidation: true,
        evidenceEngine: true,
        safetyGate: true,
        consensusValidation: true,
        clinicalCorrelation: safetyValidation?.safeDiagnosticGate === true,
        safeClinicalMode: !safetyValidation?.safeDiagnosticGate || consensusAnalysis?.safeClinicalMode || false,
        manualMode: analysisSource === "manual",
        hybridMode: analysisSource === "hybrid",
        aiVisualMode: analysisSource === "ai_visual",
      },
      metadata: {
        requestId,
        model: OPENAI_MODEL,
        pipelineVersion: "V8_TURBO_ENTERPRISE",
        architecture: "turbo_semantic_hematology_engine",
        hospitalGrade: true,
        educationalMode: true,
        images: images.length,
        imageMetadata,
        visualEvidenceScore: safetyValidation?.visualEvidenceScore || 0,
        morphologyCoherence: safetyValidation?.morphologyCoherence || 0,
        falsePositiveRisk: safetyValidation?.falsePositiveRisk || 0,
        diagnosticReliability: safetyValidation?.diagnosticReliability || 0,
        artifactProbability: safetyValidation?.artifactProbability || 0,
        safeDiagnosticGate: safetyValidation?.safeDiagnosticGate || false,
        analysisSource,
        performance: {
          imageTiming,
          visualTiming,
          engineTiming,
          safetyTiming,
          consensusTiming,
          confidenceTiming,
          totalPipelineTime,
        },
      },
    };
  } catch (error) {
    console.error("TURBO PIPELINE ERROR:", error);

    return {
      success: false,
      summary: "Erro interno no pipeline hematológico turbo.",
      riskLevel: "Erro",
      observations: error.message,
      safetyValidation: { safeDiagnosticGate: false },
      pipeline: { failed: true, version: "V8_TURBO_ENTERPRISE" },
    };
  }
}


// ============================================================================
// VALIDATION
// ============================================================================

function validateAIResult(
  result,
) {

  if (!result) {

    return {

      valid: false,

      error:
        "Resultado vazio.",
    };
  }

  if (!result.counts) {
    result.counts = {};
  }

  if (!result.morphologies) {
    result.morphologies = [];
  }

  if (!result.alerts) {
    result.alerts = [];
  }

  if (!result.observations) {
    result.observations = "";
  }

  if (!result.summary) {
    result.summary = "";
  }

  if (!result.riskLevel) {

    result.riskLevel =
      "Indefinido";
  }

  const atypicalFlags = [
    result?.findings?.reactiveLymphocytes,
    result?.findings?.atypicalLymphocytes,
    result?.findings?.largeMononuclearCells,
    result?.findings?.monocytoidAtypicalLymphocytes,
    result?.findings?.downeyLikeCells,
  ].some((v) => v === true);

  if (atypicalFlags) {
    result.normalityBlocked = true;

    result.overallAssessment =
      result.overallAssessment || {};

    result.overallAssessment.requiresHumanReview = true;

    if (
      result.morphologicRiskClass === "CLASS_0_NORMAL" ||
      !result.morphologicRiskClass
    ) {
      result.morphologicRiskClass =
        "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";
    }

    result.riskLevel =
      result.riskLevel === "Indefinido"
        ? "Achado celular isolado / possível reatividade linfoide"
        : result.riskLevel;

    result.blockNormalReason =
      Array.isArray(result.blockNormalReason)
        ? result.blockNormalReason
        : [];

    result.blockNormalReason.push(
      "Sinal de reatividade/atipia celular impede classificação como morfologia preservada."
    );

    result.blockNormalReason =
      [...new Set(result.blockNormalReason)];
  }

  return {

    valid: true,

    result,
  };
}

// ============================================================================
// ROOT
// ============================================================================

app.get(
  "/",
  (req, res) => {

    res.json({

      success: true,

      app:
        "CELLCOUNT ELITE HOSPITAL",

      model:
        OPENAI_MODEL,

      status:
        "online",

      version:
        "V6_SAFE_HYBRID",
    });
  }
);

// ============================================================================
// HEALTH
// ============================================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      success: true,

      uptime:
        process.uptime(),

      memory:
        process.memoryUsage(),

      model:
        OPENAI_MODEL,

      timestamp:
        new Date()
          .toISOString(),
    });
  }
);

// ============================================================================
// ANALYZE
// ============================================================================

app.post(

  "/analyze-slide",

  auth,

  upload.array(
    "image",
    4,
  ),

  async (
    req,
    res,
  ) => {

    try {

      const {
        userId,
        data,
      } = getUser(req);

      const uploadedFiles =
        req.files || [];

      if (
        !uploadedFiles.length
      ) {

        return res.status(400).json({

          success: false,

          error:
            "Nenhuma imagem enviada.",
        });
      }

      // ====================================================================
      // ANALYSIS SOURCE
      // ====================================================================

      const analysisSource =
        normalizeAnalysisSource(

          req.body
            ?.analysisSource,
        );

      // ====================================================================
      // MANUAL COUNTS
      // ====================================================================

      let manualCounts = {};

      try {

        manualCounts =
          typeof req.body
            ?.manualCounts ===
          "string"

            ? JSON.parse(
                req.body
                  .manualCounts,
              )

            : req.body
                ?.manualCounts || {};

      } catch {

        manualCounts = {};
      }

      console.log(
        `🔬 ${uploadedFiles.length} imagens recebidas`,
      );

      console.log(
        `🧠 SOURCE: ${analysisSource}`,
      );

      // ====================================================================
      // AI ANALYSIS
      // ====================================================================

      const structured =
        await analyzeWithOpenAI({

          images:
            uploadedFiles,

          analysisSource,

          manualCounts,
        });

      // ====================================================================
      // VALIDATION
      // ====================================================================

      const validation =
        validateAIResult(
          structured,
        );

      if (
        !validation.valid
      ) {

        return res.status(500).json({

          success: false,

          error:
            validation.error,
        });
      }

      validation.result =
        validateConsistency(
          validation.result,
        );

      if (
        validation.result.morphologicRiskClass ===
          "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
        validation.result.findings?.reactiveLymphocytes === true ||
        validation.result.findings?.atypicalLymphocytes === true
      ) {
        validation.result.normalityBlocked = true;

        validation.result.overallAssessment =
          validation.result.overallAssessment || {};

        validation.result.overallAssessment.requiresHumanReview = true;

        validation.result.overallAssessment.riskCategory =
          validation.result.morphologicRiskClass ||
          "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL";

        validation.result.blockNormalReason =
          Array.isArray(validation.result.blockNormalReason)
            ? validation.result.blockNormalReason
            : [];

        validation.result.blockNormalReason.push(
          "Célula mononuclear isolada com possível padrão reacional/atípico impede classificação como morfologia preservada."
        );

        validation.result.blockNormalReason =
          [...new Set(validation.result.blockNormalReason)];
      }

      const finalFindings =
        validation.result.findings || {};

      const finalLymphoidPattern =
        validation.result.lymphoidPatternAnalysis ||
        classifyLymphoidPattern({
          findings: finalFindings,
          visualEvidence: validation.result.visualEvidence || {},
          fieldAdequacy: validation.result.fieldAdequacy || {},
        });

      validation.result.lymphoidPatternAnalysis =
        finalLymphoidPattern;

      if (
        finalFindings.blastSuspicion === true
      ) {
        validation.result.morphologicRiskClass =
          "CLASS_4_BLAST_SUSPICION";
      }

      else if (
        finalLymphoidPattern.lymphoidPattern ===
          "LYMPHOID_MONOMORPHIC" &&
        finalFindings.plasmablasts === true &&
        finalFindings.monomorphicPopulation === true
      ) {
        validation.result.morphologicRiskClass =
          "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";
      }

      else if (
        finalLymphoidPattern.forceDowngrade === true
      ) {
        validation.result.findings.monomorphicPopulation = false;

        validation.result.morphologicRiskClass =
          finalLymphoidPattern.riskCeiling ||
          "CLASS_2_ATYPICAL_REACTIVE_PATTERN";

        validation.result.riskLevel =
          "Padrão linfoide atípico/indeterminado com necessidade de correlação";

        validation.result.overallAssessment =
          validation.result.overallAssessment || {};

        validation.result.overallAssessment.requiresHumanReview = true;

        validation.result.overallAssessment.riskCategory =
          validation.result.morphologicRiskClass;
      }

// ====================================================================
// CLASS_3 — POPULAÇÃO MONONUCLEAR ATÍPICA SUSTENTADA
// ====================================================================

const visibleLeukocytes =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const hasAtypicalPopulationSignal =
  finalFindings.largeMononuclearCells === true ||
  finalFindings.atypicalLymphocytes === true ||
  finalFindings.plasmacytoidCells === true ||
  finalFindings.plasmocytes === true ||
  finalFindings.plasmablasts === true ||
  finalFindings.monomorphicPopulation === true;

if (
  hasAtypicalPopulationSignal === true &&
  visibleLeukocytes >= 8 &&
  validation.result.morphologicRiskClass !== "CLASS_4_BLAST_SUSPICION" &&
  validation.result.morphologicRiskClass !== "CLASS_5_HIGH_NEOPLASTIC_SUSPICION"
) {
  validation.result.normalityBlocked = true;

  validation.result.morphologicRiskClass =
    "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";

  validation.result.riskLevel =
    "População mononuclear atípica sustentada";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION";

  validation.result.blockNormalReason =
    Array.isArray(validation.result.blockNormalReason)
      ? validation.result.blockNormalReason
      : [];

  validation.result.blockNormalReason.push(
    "Múltiplas células mononucleares atípicas sustentadas no campo impedem classificação como achado isolado."
  );

  validation.result.blockNormalReason =
    [...new Set(validation.result.blockNormalReason)];
}

// ====================================================================
// RISK COHERENCE OVERRIDE — FIELD-AWARE
// ====================================================================

const currentRiskClass =
  validation.result.morphologicRiskClass || "";

const visibleLeukocytesRisk =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const adequatePopulationRisk =
  validation.result.fieldAdequacy?.adequateForPopulationAssessment === true;

const hasAtypicalPopulation =
  adequatePopulationRisk === true &&
  visibleLeukocytesRisk >= 8 &&
  (
    currentRiskClass === "CLASS_2_ATYPICAL_POPULATION" ||
    currentRiskClass === "CLASS_2_ATYPICAL_REACTIVE_PATTERN" ||
    currentRiskClass === "CLASS_3_SUSPICIOUS_ATYPICAL_POPULATION" ||
    validation.result.findings?.monomorphicPopulation === true ||
    validation.result.findings?.plasmacytoidCells === true ||
    validation.result.findings?.plasmablasts === true ||
    validation.result.findings?.plasmocytes === true ||
    validation.result.findings?.largeMononuclearCells === true
  );

if (hasAtypicalPopulation) {
  validation.result.normalityBlocked = true;

  validation.result.riskLevel =
    "Alteração morfológica relevante — padrão indeterminado";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "Alteração morfológica relevante";

  validation.result.confidenceAnalysis =
    validation.result.confidenceAnalysis || {};

  validation.result.confidenceAnalysis.hematologicRisk =
    validation.result.confidenceAnalysis.hematologicRisk || {};

  validation.result.confidenceAnalysis.hematologicRisk.level =
    "intermediate";

  validation.result.confidenceAnalysis.hematologicRisk.label =
    "RISCO INTERMEDIÁRIO";

  validation.result.confidenceAnalysis.hematologicRisk.score =
    Math.max(
      Number(validation.result.confidenceAnalysis.hematologicRisk.score || 0),
      45,
    );

  validation.result.blockNormalReason =
    Array.isArray(validation.result.blockNormalReason)
      ? validation.result.blockNormalReason
      : [];

  validation.result.blockNormalReason.push(
    "População celular atípica sustentada impede classificação como baixo risco morfológico."
  );

  validation.result.blockNormalReason =
    [...new Set(validation.result.blockNormalReason)];
}

// ====================================================================
// REMOVE OVERCALLING TERMS WHEN CONFIDENCE IS LIMITED
// ====================================================================

const limitedConfidence =
  Number(validation.result.confidenceAnalysis?.globalConfidenceScore || 0) < 70;

if (limitedConfidence) {
  const forbiddenTerms = [
    "monomórfica/plasmoblástica",
    "monomórfica",
    "plasmoblástica",
    "clonal",
    "neoplásica",
  ];

  const replacement =
    "mononuclear atípica indeterminada";

  const cleanText = (text) => {
    if (typeof text !== "string") return text;

    let cleaned = text;

    for (const term of forbiddenTerms) {
      cleaned = cleaned.replaceAll(term, replacement);
    }

    return cleaned;
  };

  validation.result.mainFinding =
    cleanText(validation.result.mainFinding);

  validation.result.primaryFinding =
    cleanText(validation.result.primaryFinding);

  validation.result.clinicalMeaning =
    cleanText(validation.result.clinicalMeaning);

  validation.result.interpretiveSynthesis =
    cleanText(validation.result.interpretiveSynthesis);

  validation.result.hematologicReasoning =
    cleanText(validation.result.hematologicReasoning);

  if (validation.result.morphologyAnalysis) {
    validation.result.morphologyAnalysis.summary =
      cleanText(validation.result.morphologyAnalysis.summary);

    validation.result.morphologyAnalysis.overview =
      cleanText(validation.result.morphologyAnalysis.overview);

    validation.result.morphologyAnalysis.leukocyteReview =
      cleanText(validation.result.morphologyAnalysis.leukocyteReview);
  }
}

// ====================================================================
// ATYPICAL POPULATION LANGUAGE SAFETY — FIELD-AWARE
// ====================================================================

const globalConfidence =
  Number(
    validation.result.confidenceAnalysis?.globalConfidenceScore ||
    validation.result.confidenceAnalysis?.confidenceHierarchy?.global ||
    0,
  );

const visibleLeukocytesLanguage =
  validation.result.fieldAdequacy?.visibleLeukocytes || 0;

const adequatePopulationLanguage =
  validation.result.fieldAdequacy?.adequateForPopulationAssessment === true;

const hasStrongAtypia =
  validation.result.findings?.monomorphicPopulation === true ||
  validation.result.findings?.plasmablasts === true ||
  validation.result.findings?.plasmacytoidCells === true;

const hasSupportiveAtypia =
  validation.result.findings?.largeMononuclearCells === true ||
  validation.result.findings?.plasmocytes === true;

const isAtypicalPopulation =
  adequatePopulationLanguage === true &&
  visibleLeukocytesLanguage >= 12 &&
  (
    hasStrongAtypia ||
    (
      hasSupportiveAtypia &&
      globalConfidence >= 70
    )
  );

if (isAtypicalPopulation) {
  validation.result.normalityBlocked = true;

  validation.result.riskLevel =
    "Alteração morfológica relevante — padrão indeterminado";

  validation.result.overallAssessment =
    validation.result.overallAssessment || {};

  validation.result.overallAssessment.requiresHumanReview = true;

  validation.result.overallAssessment.riskCategory =
    "Alteração morfológica relevante";

  validation.result.confidenceAnalysis =
    validation.result.confidenceAnalysis || {};

  validation.result.confidenceAnalysis.riskClassification =
    "Padrão indeterminado — revisão especializada recomendada";

  const safeMainFinding =
    globalConfidence < 70
      ? "Sugere-se alteração mononuclear atípica em campo com representatividade suficiente, porém sem confirmação de natureza reacional, clonal ou imatura pela imagem isolada."
      : "Observa-se alteração mononuclear atípica em campo com representatividade suficiente, sem critérios para diagnóstico definitivo pela imagem isolada.";

  validation.result.mainFinding = safeMainFinding;
  validation.result.primaryFinding = safeMainFinding;

  validation.result.morphologyAnalysis =
    validation.result.morphologyAnalysis || {};

  validation.result.morphologyAnalysis.summary =
    safeMainFinding;

  validation.result.morphologyAnalysis.overview =
    "Alteração morfológica mononuclear observada em campo representativo. A classificação exige correlação com múltiplos campos e hemograma.";

  validation.result.morphologyAnalysis.leukocyteReview =
    "Há alteração leucocitária/mononuclear em campo com representatividade suficiente. Não há evidência inequívoca de blastos ou bastonetes de Auer.";
}

      validation.result =
        sanitizeNarrativeRepetition(
          validation.result,
        );

      validation.result =
        sanitizeHematologyLanguage(
          validation.result,
        );

      console.log("================================");

      if (
        finalResult?.morphologicRiskClass ===
          "CLASS_1_LIMITED_FIELD" ||
        finalResult?.finalClassification ===
          "CLASS_1_LIMITED_FIELD"
      ) {

        finalResult.whatAISees = {
          ...(finalResult.whatAISees || {}),

          globalField:
            "Campo microscópico limitado.",

          cellularity:
            "Representatividade insuficiente para inferir celularidade global.",

          erythrocytes:
            "Avaliação eritrocitária limitada ao campo enviado.",

          leukocytes:
            "Poucos leucócitos maduros visíveis.",

          platelets:
            "Avaliação plaquetária limitada.",

          dominantFinding:
            "Campo microscópico limitado.",

          freeNarrative:
            "Campo microscópico limitado. A imagem isolada não permite inferir normalidade hematológica global.",
        };

        finalResult.morphologyAnalysis = {
          ...(finalResult.morphologyAnalysis || {}),

          overview:
            "Campo microscópico limitado para conclusão morfológica global.",

          erythrocyteReview:
            "Avaliação eritrocitária limitada ao campo enviado.",

          leukocyteReview:
            "Poucos leucócitos maduros visíveis. Não há evidência inequívoca de blastos.",

          plateletReview:
            "Avaliação plaquetária limitada.",

          biologicalInterpretation:
            "Representatividade insuficiente para afirmar normalidade hematológica.",

          differentialDiagnosis:
            "",

          summary:
            "Campo microscópico limitado contendo poucos leucócitos maduros. Recomenda-se avaliação de múltiplos campos.",
        };

        finalResult.structuredReport = {
          ...(finalResult.structuredReport || {}),

          erythrocyteFindings:
            "Avaliação limitada.",

          leukocyteFindings:
            "Poucos leucócitos maduros visíveis.",

          plateletFindings:
            "Avaliação limitada.",

          clinicalMeaning:
            "Representatividade insuficiente para afirmar normalidade hematológica.",

          interpretiveSynthesis:
            "Campo microscópico limitado.",

          hematologicReasoning:
            "A imagem isolada não permite conclusão hematológica global.",
        };

        finalResult.clinicalMeaning =
          "Campo microscópico limitado. Não permite afirmar estado hematológico normal.";

        finalResult.interpretiveSynthesis =
          "Campo microscópico limitado. A interpretação deve permanecer conservadora.";

        finalResult.educationalImpact =
          "Exemplo de campo limitado para avaliação morfológica.";
      }

      console.log("FINAL VALIDATED RESULT");
      console.log(
        JSON.stringify(
          {
            normalityBlocked:
              validation.result.normalityBlocked,

            morphologicRiskClass:
              validation.result.morphologicRiskClass,

            riskLevel:
              validation.result.riskLevel,

            requiresHumanReview:
              validation.result.overallAssessment?.requiresHumanReview,

            findings:
              validation.result.findings,

            blockNormalReason:
              validation.result.blockNormalReason,

            confidenceAnalysis:
              validation.result.confidenceAnalysis,
          },
          null,
          2,
        ),
      );
      console.log("================================");

// ============================================================================
// FINAL CONSISTENCY LOCK — evita contradição entre cards do Flutter
// ============================================================================

let finalResult = validation.result;

// ============================================================================
// PARASITE / PLASMODIUM GOVERNOR V1
// ============================================================================

finalResult.findings = finalResult.findings || {};
finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
finalResult.whatAISees = finalResult.whatAISees || {};

const rawTextForParasite = JSON.stringify(finalResult).toLowerCase();

const hasPlasmodiumSignal =
  rawTextForParasite.includes("plasmodium") ||
  rawTextForParasite.includes("parasita intraeritroc") ||
  rawTextForParasite.includes("parasitas intraeritroc") ||
  rawTextForParasite.includes("gametócito") ||
  rawTextForParasite.includes("gametocito") ||
  rawTextForParasite.includes("falciforme") ||
  rawTextForParasite.includes("crescente");

if (hasPlasmodiumSignal) {
  finalResult.normalityBlocked = true;

  finalResult.findings.parasiteSuspected = true;
  finalResult.findings.plasmodiumSuspected = true;

  finalResult.parasiteAnalysis = {
    suspected: true,
    genus: "Plasmodium spp.",
    probableSpecies:
      rawTextForParasite.includes("falciforme") ||
      rawTextForParasite.includes("crescente") ||
      rawTextForParasite.includes("falciparum")
        ? "Plasmodium falciparum sugerido morfologicamente"
        : "Espécie não definida pela imagem isolada",

    formsObserved: [
      rawTextForParasite.includes("gametócito") ||
      rawTextForParasite.includes("gametocito") ||
      rawTextForParasite.includes("falciforme") ||
      rawTextForParasite.includes("crescente")
        ? "Gametócito falciforme/crescente sugestivo"
        : "Gametócito não confirmado neste campo",

      rawTextForParasite.includes("anel") ||
      rawTextForParasite.includes("forma anelar") ||
      rawTextForParasite.includes("trofozoíto jovem") ||
      rawTextForParasite.includes("trofozoito jovem")
        ? "Forma anelar intraeritrocitária sugestiva"
        : "Formas anelares intraeritrocitárias não confirmadas neste campo",

      rawTextForParasite.includes("trofozoíto") ||
      rawTextForParasite.includes("trofozoito")
        ? "Trofozoíto observado/sugerido"
        : "Trofozoítos maduros não evidenciados neste campo",

      rawTextForParasite.includes("esquizonte")
        ? "Esquizonte observado/sugerido"
        : "Esquizontes não evidenciados neste campo",
    ],

    dominantForm:
      rawTextForParasite.includes("gametócito") ||
      rawTextForParasite.includes("gametocito") ||
      rawTextForParasite.includes("falciforme") ||
      rawTextForParasite.includes("crescente")
        ? "Gametócito falciforme/crescente"
        : "Forma parasitária não totalmente definida",

    interpretation:
      "Achado parasitário sugestivo de Plasmodium spp. A identificação da espécie e da fase evolutiva deve ser confirmada em múltiplos campos, gota espessa/esfregaço completo e correlação laboratorial.",

    safetyNote:
      "A imagem isolada não permite quantificação de parasitemia nem confirmação definitiva da espécie.",
  };

  finalResult.finalClassification =
    finalResult.finalClassification === "CLASS_1_LIMITED_FIELD"
      ? "CLASS_1_LIMITED_FIELD_WITH_PARASITE_SUSPICION"
      : "CLASS_PARASITIC_FINDING";

  finalResult.riskLevel =
    "Achado parasitário sugestivo — requer confirmação laboratorial";

  finalResult.mainFinding =
    "Achado parasitário sugestivo de Plasmodium spp. Recomenda-se avaliação de múltiplos campos, gota espessa/esfregaço completo e correlação clínico-laboratorial.";

  finalResult.primaryFinding = finalResult.mainFinding;

  finalResult.morphologyAnalysis.overview =
    "Campo com achado parasitário sugestivo de Plasmodium spp. A amostra não deve ser classificada como morfologia preservada global.";

  finalResult.morphologyAnalysis.erythrocyteReview =
    "Eritrócitos com possível parasitismo intraeritrocitário. Avaliar formas anelares, trofozoítos, esquizontes e gametócitos em múltiplos campos.";

  finalResult.morphologyAnalysis.leukocyteReview =
    "Leucócitos sem evidência inequívoca de blastos neste campo. O foco morfológico principal é parasitológico.";

  finalResult.clinicalMeaning =
    "Achado compatível com suspeita parasitológica por Plasmodium spp. A confirmação exige gota espessa, esfregaço completo, identificação de espécie e quantificação de parasitemia conforme protocolo laboratorial.";

  finalResult.interpretiveSynthesis =
    "A imagem sugere presença de Plasmodium spp., com necessidade de confirmação em exame parasitológico adequado. Não deve ser interpretada como lâmina hematologicamente normal.";
}

finalResult.findings = finalResult.findings || {};
finalResult.morphologyAnalysis = finalResult.morphologyAnalysis || {};
finalResult.whatAISees = finalResult.whatAISees || {};
finalResult.overallAssessment = finalResult.overallAssessment || {};
finalResult.structuredReport = finalResult.structuredReport || {};
finalResult.confidenceAnalysis = finalResult.confidenceAnalysis || {};

const finalVisibleLeukocytes =
  finalResult.visibleLeukocytes ??
  finalResult.fieldAdequacy?.visibleLeukocytes ??
  finalResult.rawResponse?.fieldAdequacy?.visibleLeukocytes ??
  0;

const isLimitedFieldFinal =
  finalVisibleLeukocytes < 8 ||
  finalResult.finalClassification === "CLASS_1_LIMITED_FIELD" ||
  finalResult.morphologicRiskClass === "CLASS_1_LIMITED_FIELD" ||
  finalResult.morphologicRiskClass === "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL" ||
  finalResult.fieldAdequacy?.adequateForPopulationAssessment === false;

const limitedConclusion =
  "Campo microscópico limitado contendo poucos leucócitos maduros. Não há evidência inequívoca de blastos ou células imaturas críticas.";

const limitedRecommendation =
  "Recomenda-se avaliação de múltiplos campos da lâmina, correlação com hemograma completo e revisão microscópica profissional.";

if (isLimitedFieldFinal && finalResult.findings?.parasiteSuspected !== true) {
  finalResult.finalClassification = "CLASS_1_LIMITED_FIELD";
  finalResult.morphologicRiskClass = "CLASS_1_LIMITED_FIELD";
  finalResult.riskLevel = "Campo limitado";
  finalResult.normalityBlocked = false;

  finalResult.finalConclusion = limitedConclusion;
  finalResult.mainFinding = limitedConclusion;
  finalResult.primaryFinding = limitedConclusion;
  finalResult.finalRecommendation = limitedRecommendation;

  finalResult.hideEducationalHypotheses = true;
  finalResult.hideClinicalCorrelations = true;
  finalResult.hideDifferentialDiagnosis = true;
  finalResult.hidePopulationAnalysis = true;

  finalResult.populationAnalysis = null;
  finalResult.patternRecognition = null;

  finalResult.educationalHypotheses = [];
  finalResult.associatedEducationalHypotheses = [];
  finalResult.clinicalCorrelations = [];
  finalResult.possibleClinicalCorrelations = [];
  finalResult.clinicalCorrelationNeeds = [
    "Hemograma completo",
    "Revisão microscópica profissional",
    "Avaliação de múltiplos campos da lâmina",
  ];
  finalResult.differentialDiagnosis = [];

  finalResult.atypicalPopulationDetected = false;
  finalResult.reactivePopulationDetected = false;
  finalResult.clonalPopulationDetected = false;

  finalResult.findings.reactiveLymphocytes = false;
  finalResult.findings.largeMononuclearCells = false;
  finalResult.findings.plasmacytoidCells = false;
  finalResult.findings.plasmocytes = false;
  finalResult.findings.plasmablasts = false;
  finalResult.findings.atypicalLymphocytes = false;
  finalResult.findings.monomorphicPopulation = false;
  finalResult.findings.atypicalPopulation = false;
  finalResult.findings.clonalPopulation = false;
  finalResult.findings.immatureCells = false;
  finalResult.findings.blastSuspicion = false;

  finalResult.morphologyAnalysis.overview =
    "Campo microscópico limitado para conclusão morfológica global. A baixa representatividade celular impede afirmar morfologia preservada ou padrão populacional sustentado.";

  finalResult.morphologyAnalysis.summary =
    limitedConclusion;

  finalResult.morphologyAnalysis.erythrocyteReview =
    "Avaliação eritrocitária limitada ao campo enviado. Não é adequado afirmar preservação global da série eritrocitária apenas por este campo isolado.";

  finalResult.morphologyAnalysis.leukocyteReview =
    "Avaliação leucocitária limitada por baixa representatividade celular. Observam-se poucos leucócitos maduros, sem evidência inequívoca de blastos ou células imaturas críticas. Não é possível inferir padrão reacional, clonal ou populacional sustentado.";

  finalResult.morphologyAnalysis.plateletReview =
    "Avaliação plaquetária limitada ao campo enviado. A imagem isolada não permite conclusão quantitativa ou morfológica global confiável da série plaquetária.";

  finalResult.morphologyAnalysis.biologicalInterpretation =
    "A baixa representatividade do campo impede conclusão hematológica global. Os achados devem ser interpretados de forma conservadora e correlacionados com hemograma e revisão de múltiplos campos.";

  finalResult.morphologyAnalysis.differentialDiagnosis = "";

  finalResult.whatAISees.globalField =
    "Campo microscópico limitado para avaliação global.";

  finalResult.whatAISees.cellularity =
    "Baixa representatividade leucocitária para análise populacional confiável.";

  finalResult.whatAISees.erythrocytes =
    "Hemácias visíveis no campo, porém sem base suficiente para afirmar preservação global da série.";

  finalResult.whatAISees.leukocytes =
    "Poucos leucócitos maduros visíveis. Não há evidência inequívoca de blastos ou células imaturas críticas.";

  finalResult.whatAISees.platelets =
    "Avaliação plaquetária limitada pela representatividade do campo.";

  finalResult.whatAISees.dominantFinding =
    "Campo limitado.";

  finalResult.whatAISees.unusualStructures =
    "Nenhuma estrutura crítica inequívoca evidenciada no campo limitado.";

  finalResult.whatAISees.negativeFindings =
    "Blastos inequívocos não evidenciados. Células imaturas críticas não evidenciadas. Bastonetes de Auer não evidenciados.";

  finalResult.whatAISees.imageLimitations =
    "Análise limitada ao campo enviado, com baixa representatividade para conclusão global.";

  finalResult.whatAISees.freeNarrative =
    "Campo microscópico limitado. A imagem permite triagem morfológica inicial, mas não permite afirmar morfologia preservada, estado hematológico normal ou padrão populacional sustentado.";

  finalResult.interpretiveSynthesis =
    "Campo microscópico limitado. Ausência de blastos inequívocos ou células imaturas críticas no campo analisado. A imagem isolada não permite classificar a lâmina como normal ou preservada.";

  finalResult.clinicalMeaning =
    "A baixa representatividade celular limita a interpretação. O campo analisado não demonstra blastos inequívocos ou células imaturas críticas, porém não permite conclusão global sobre normalidade hematológica. Recomenda-se correlação com hemograma completo, dados clínicos e revisão microscópica profissional.";

  finalResult.hematologicReasoning = {
    whatISee:
      "Campo microscópico com poucos leucócitos maduros visíveis e fundo eritrocitário predominante.",
    whatItResembles:
      "Campo limitado para avaliação populacional. Não há base suficiente para afirmar padrão normal, reacional ou clonal sustentado.",
    whatICannotConfirm:
      "Não é possível confirmar normalidade global, morfologia preservada, estado hematológico normal, clonalidade, malignidade ou diagnóstico definitivo pela imagem isolada.",
    finalInterpretation:
      limitedConclusion,
  };

  finalResult.overallAssessment.requiresHumanReview = true;
  finalResult.overallAssessment.riskCategory = "CLASS_1_LIMITED_FIELD";
  finalResult.overallAssessment.mainImpression = limitedConclusion;

  finalResult.structuredReport.resumoMorfologico =
    "Campo microscópico limitado para conclusão global.";

  finalResult.structuredReport.interpretacaoEducacional =
    "A baixa representatividade celular impede afirmar morfologia preservada ou estado hematológico normal.";

  finalResult.structuredReport.limitacoes =
    limitedRecommendation;

  finalResult.confidenceAnalysis.riskClassification =
    "Campo limitado — revisão de múltiplos campos recomendada";

// ============================================================================
// LIMITED FIELD — TEXT HARD LOCK
// Remove conclusões globais incompatíveis com campo limitado
// ============================================================================

finalResult.erythrocyteFindings = {};
finalResult.leukocyteFindings = {};
finalResult.plateletFindings = {};

finalResult.morphologyAnalysis.erythrocyteReview =
  "Avaliação eritrocitária limitada ao campo enviado. Não foram observadas alterações eritrocitárias marcantes neste campo, mas a imagem isolada não permite afirmar normocitose, normocromia ou preservação global.";

finalResult.morphologyAnalysis.leukocyteReview =
  "Avaliação leucocitária limitada por baixa representatividade. Poucos leucócitos maduros são visíveis, sem evidência inequívoca de blastos ou células imaturas críticas neste campo. A imagem isolada não permite afirmar normalidade leucocitária global.";

finalResult.morphologyAnalysis.plateletReview =
  "Avaliação plaquetária limitada ao campo enviado. Plaquetas podem ser visualizadas, mas a imagem isolada não permite afirmar número adequado, preservação global ou ausência de alteração plaquetária.";

finalResult.morphologyAnalysis.absentFindings =
  "No campo analisado, não há evidência inequívoca de blastos, bastonetes de Auer ou células imaturas críticas. A representatividade limitada não permite exclusão diagnóstica global.";

finalResult.whatAISees.erythrocytes =
  "Hemácias visíveis no campo, sem alterações marcantes evidentes nesta imagem isolada; não afirmar normocitose/normocromia global.";

finalResult.whatAISees.platelets =
  "Plaquetas visíveis no campo, porém sem base para afirmar quantidade global adequada.";

finalResult.whatAISees.negativeFindings =
  "Elementos críticos não evidenciados no campo analisado, sem exclusão global pela baixa representatividade.";

finalResult.structuredReport.resumoMorfologico =
  "Campo microscópico limitado; não emitir conclusão global de normalidade ou preservação.";

finalResult.structuredReport.interpretacaoEducacional =
  "A baixa representatividade celular impede afirmar morfologia preservada, normocitose, normocromia, número plaquetário adequado ou estado hematológico normal.";

finalResult.structuredReport.limitacoes =
  "Campo limitado. Necessária avaliação de múltiplos campos, hemograma completo e revisão microscópica profissional.";

finalResult.overallAssessment.mainImpression =
  finalResult.finalConclusion;

finalResult.overallAssessment.requiresHumanReview = true;

}

const hasAtypicalPopulationFinal =
  !isLimitedFieldFinal &&
  (
    finalResult?.normalityBlocked === true ||
    finalResult?.morphologicRiskClass === "CLASS_2_ATYPICAL_POPULATION" ||
    finalResult?.morphologicRiskClass === "CLASS_3_HETEROGENEOUS_ATYPICAL_POPULATION" ||
    finalResult?.findings?.monomorphicPopulation === true ||
    finalResult?.findings?.plasmacytoidCells === true ||
    finalResult?.findings?.plasmablasts === true ||
    finalResult?.findings?.plasmocytes === true ||
    finalResult?.findings?.largeMononuclearCells === true ||
    finalResult?.riskLevel?.toLowerCase()?.includes("atípica")
  );

if (hasAtypicalPopulationFinal) {
  finalResult.normalityBlocked = true;

  finalResult.riskLevel =
    "Alteração morfológica relevante — padrão indeterminado";

  finalResult.overallAssessment.requiresHumanReview = true;
  finalResult.overallAssessment.riskCategory =
    "Alteração morfológica relevante";

  finalResult.confidenceAnalysis.riskClassification =
    "Padrão indeterminado — revisão especializada recomendada";

  const safeMainFinding =
    "Observa-se alteração mononuclear atípica em campo representativo. A imagem isolada não permite definir natureza reacional, clonal ou imatura.";

  finalResult.mainFinding = safeMainFinding;
  finalResult.primaryFinding = safeMainFinding;
  finalResult.morphologyAnalysis.summary = safeMainFinding;

  finalResult.morphologyAnalysis.overview =
    "População celular atípica observada. A amostra não deve ser classificada como morfologia preservada.";

  finalResult.whatAISees.freeNarrative =
    "Campo com achado morfológico relevante. A avaliação isolada não permite definir natureza reacional, clonal ou imatura sem correlação hematológica.";

  finalResult.morphologyAnalysis.leukocyteReview =
    "Observa-se achado leucocitário/mononuclear atípico. A imagem isolada não permite definir com segurança natureza reacional, clonal ou imatura. Não há evidência inequívoca de blastos.";

  finalResult.clinicalMeaning =
    "A presença de achado celular atípico requer correlação com hemograma completo, diferencial leucocitário, contexto clínico e revisão microscópica profissional. A imagem não permite diagnóstico definitivo.";

  finalResult.interpretiveSynthesis =
    "Achado morfológico atípico identificado. A interpretação deve permanecer conservadora, sem inferir malignidade, clonalidade ou leucemia apenas pela imagem.";
}

console.log("================================");

  finalResult = applyLimitedFieldFinalLock(finalResult);

  console.log("🦠 PARASITE FINAL CHECK");
  console.log(
    JSON.stringify(
      {
        parasiteAnalysis: finalResult.parasiteAnalysis,
        parasiteSuspected: finalResult.findings?.parasiteSuspected,
        plasmodiumSuspected: finalResult.findings?.plasmodiumSuspected,
        mainFinding: finalResult.mainFinding,
        summary: finalResult.morphologyAnalysis?.summary,
      },
      null,
      2,
    ),
  );

console.log("FINAL GOVERNED RESULT");
console.log(
  JSON.stringify(
    {
      finalClassification: finalResult.finalClassification,
      morphologicRiskClass: finalResult.morphologicRiskClass,
      riskLevel: finalResult.riskLevel,
      visibleLeukocytes: finalVisibleLeukocytes,
      hideEducationalHypotheses: finalResult.hideEducationalHypotheses,
      hideClinicalCorrelations: finalResult.hideClinicalCorrelations,
      mainFinding: finalResult.mainFinding,
      overview: finalResult.morphologyAnalysis?.overview,
      clinicalMeaning: finalResult.clinicalMeaning,
    },
    null,
    2,
  ),
);
console.log("================================");

      return res.json({

        success: true,

        analysis:
          finalResult,

        metadata: {

          model:
            OPENAI_MODEL,

          timestamp:
            new Date()
              .toISOString(),

          images:
            uploadedFiles.length,

          userId,

          totalUses:
            data.totalUses,

          analysisSource,
        },
      });

    } catch (error) {

      console.error(
        "ANALYZE-SLIDE ERROR:",
        error,
      );

      return res.status(500).json({

        success: false,

        error:
          "Erro ao analisar lâmina.",

        detail:
          error.message,
      });
    }
  }
);

// ============================================================================
// HEMA ASK
// ============================================================================

app.post(
  "/hema-ask",

  auth,

  upload.array(
    "files",
    4,
  ),

  async (req, res) => {

    try {

      const {
        question = "",
      } = req.body || {};


      const uploadedFiles =
        req.files || [];


      const content = [
        {
          type: "text",

          text: `

Você é o HemaAsk AI Enterprise V11.

Sistema avançado de educação hematológica, morfologia celular, hematopatologia, correlação clínico-laboratorial e interpretação microscópica assistida por inteligência artificial.

════════════════════════════════════════════════════

MISSÃO

Ensinar hematologia em nível universitário, hospitalar e de pós-graduação.

Atuar simultaneamente como:

• Professor universitário de Hematologia
• Hematologista clínico
• Hematopatologista
• Especialista em morfologia celular
• Especialista em medicina laboratorial
• Consultor em análises clínicas
• Tutor acadêmico avançado

Seu objetivo é ensinar raciocínio hematológico.

Não responder como chatbot.

Responder como especialista experiente.

════════════════════════════════════════════════════

IDIOMA

Detecte automaticamente o idioma da pergunta.

Responda integralmente no mesmo idioma utilizado pelo usuário.

Nunca misturar idiomas.

Caso o usuário solicite explicitamente outro idioma, respeitar sua solicitação.

Manter nomenclaturas internacionais quando relevante:

Blast
Myeloblast
Lymphoblast
Schistocyte
Auer Rod
Howell-Jolly Body
CD34
CD117
MPO
FLT3
NPM1
BCR-ABL1
JAK2

════════════════════════════════════════════════════

NÍVEL DE RESPOSTA

Responder em nível compatível com:

• Medicina
• Biomedicina
• Farmácia
• Residência Médica
• Hematologia
• Patologia Clínica
• Pós-graduação em Análises Clínicas

Priorizar:

• fisiopatologia
• correlação clínico-laboratorial
• mecanismos celulares
• interpretação prática
• raciocínio diagnóstico
• morfologia microscópica
• medicina baseada em evidências

Evitar:

• respostas superficiais
• definições de dicionário
• respostas excessivamente curtas
• respostas genéricas

Sempre explicar:

• o que é
• por que acontece
• qual a importância
• qual o impacto clínico
• quais as possíveis correlações
• quais os diferenciais
• quais exames ajudam na investigação

════════════════════════════════════════════════════

SE HOUVER IMAGEM, FOTO OU DOCUMENTO

Responder obrigatoriamente nesta ordem:

1. O que é visível
2. Descrição morfológica
3. Interpretação educacional
4. Possíveis correlações
5. Limitações da análise
6. Necessidade de validação profissional

Nunca inverter essa ordem.

Nunca afirmar diagnóstico baseado apenas na imagem.

════════════════════════════════════════════════════

ESTRUTURA OBRIGATÓRIA

# 🔬 O QUE ESTOU OBSERVANDO

Descrever claramente o conceito, achado ou estrutura identificada.

Se houver imagem:
descrever exatamente o que está visível.

════════════════════════════════════════════════════

# 🧬 ORIGEM E FISIOPATOLOGIA

Explicar:

• origem celular
• linhagem hematopoética
• mecanismos biológicos envolvidos
• processos de maturação
• alterações fisiopatológicas relevantes

════════════════════════════════════════════════════

# 🔎 MORFOLOGIA MICROSCÓPICA

Descrever:

• tamanho celular
• relação núcleo/citoplasma
• cromatina
• nucléolos
• citoplasma
• granulações
• segmentação
• inclusões celulares
• alterações estruturais

Utilizar linguagem microscópica profissional.

════════════════════════════════════════════════════

# 🧫 IMUNOFENOTIPAGEM E MARCADORES

Quando aplicável:

• CD34
• CD117
• MPO
• CD13
• CD33
• CD19
• CD10
• CD7
• HLA-DR

ou outros marcadores relevantes.

Explicar seu significado.

════════════════════════════════════════════════════

# 📊 SIGNIFICADO HEMATOLÓGICO

Responder ao:

"E daí?"

Explicar:

• por que o achado importa
• relevância hematológica
• consequências biológicas
• implicações clínicas potenciais

════════════════════════════════════════════════════

# 🏥 IMPACTO CLÍNICO

Explicar o que esse achado pode representar na prática clínica.

Descrever possíveis repercussões:

• anemia
• neutropenia
• trombocitopenia
• hemólise
• falência medular
• inflamação
• infecção
• neoplasias hematológicas

Quando aplicável.

════════════════════════════════════════════════════

# ⚠️ POSSÍVEIS ASSOCIAÇÕES CLÍNICAS

Utilizar exclusivamente:

• pode sugerir
• pode estar associado a
• pode ocorrer em
• pode ser observado em

NUNCA:

• diagnosticar
• confirmar doença
• fechar laudo
• afirmar neoplasia

════════════════════════════════════════════════════

# 🧠 DIAGNÓSTICOS DIFERENCIAIS EDUCACIONAIS

Listar condições que podem produzir achados semelhantes.

Explicar como diferenciá-las.

Sempre deixar claro:

"não representam diagnóstico definitivo."

════════════════════════════════════════════════════

# 🧪 EXAMES CORRELATOS

Listar apenas exames relevantes.

Exemplos:

• Hemograma
• Esfregaço periférico
• Reticulócitos
• LDH
• Bilirrubinas
• Haptoglobina
• Ferritina
• Mielograma
• Biópsia de medula óssea
• Citometria de fluxo
• Citogenética
• Biologia molecular

Explicar por que cada exame pode ser útil.

════════════════════════════════════════════════════

# 🖼️ ATLAS HEMATOLÓGICO RELACIONADO

Descrever os achados morfológicos clássicos observados em atlas hematológicos.

Exemplos:

• cromatina frouxa
• nucléolos evidentes
• esquizócitos fragmentados
• granulações tóxicas
• corpúsculos de Howell-Jolly

Relacionar com o atlas educacional quando pertinente.

════════════════════════════════════════════════════

# 🎓 RACIOCÍNIO EDUCACIONAL

Conectar:

morfologia
→ fisiopatologia
→ laboratório
→ clínica
→ investigação

Explicar como um professor experiente.

════════════════════════════════════════════════════

# 📚 PÉROLAS PARA PROVAS E CONCURSOS

Fornecer de 3 a 5 pontos clássicos frequentemente cobrados em:

• Residência Médica
• Hematologia
• Concursos
• Universidades

════════════════════════════════════════════════════

# ❓ QUESTÃO COMENTADA

Criar uma questão objetiva inédita com:

A)
B)
C)
D)
E)

Explicar detalhadamente a alternativa correta.

════════════════════════════════════════════════════

# 👨‍⚕️ VALIDAÇÃO PROFISSIONAL

Informar obrigatoriamente:

• finalidade educacional
• não constitui diagnóstico
• não substitui laudo
• não substitui avaliação médica
• requer correlação clínico-laboratorial
• requer interpretação por profissional habilitado

════════════════════════════════════════════════════

# 📚 NÍVEL DE EVIDÊNCIA EDUCACIONAL

Classificar:

★★★★★ Muito Alta
★★★★ Alta
★★★ Moderada

Basear explicações em referências reconhecidas:

• WHO Classification
• ICC Classification
• Williams Hematology
• Wintrobe's Clinical Hematology
• Hoffbrand's Essential Haematology

════════════════════════════════════════════════════

REGRAS DE SEGURANÇA

Nunca emitir diagnóstico definitivo.

Nunca substituir avaliação médica.

Nunca afirmar doença baseada apenas em imagem.

Nunca afirmar leucemia, linfoma ou outra neoplasia apenas por morfologia isolada.

Priorizar especificidade sobre sensibilidade.

Em caso de dúvida:

explicar as limitações da análise.

════════════════════════════════════════════════════

Pergunta:

${question}


`
        }
      ];


      for (const file of uploadedFiles) {

        const base64 =
          file.buffer.toString("base64");


        content.push({

          type: "image_url",

          image_url: {

            url:
              `data:${file.mimetype};base64,${base64}`,

          },
        });
      }

      const completion =
        await openai.chat.completions.create({

          model:
            OPENAI_MODEL,

          temperature:
            0.25,

          messages: [

            {
              role:
                "user",

              content,
            },
          ],
        });


      const answer =
        completion
          ?.choices?.[0]
          ?.message
          ?.content ||
        "Não foi possível gerar resposta.";


      return res.json({

        success:
          true,

        answer,

        attachments:
          uploadedFiles.length,

      });


    } catch (error) {


      console.error(
        "HEMA ASK ERROR:",
        error,
      );


      return res.status(500).json({

        success:
          false,

        error:
          error.message,

      });
    }
  },
);

// ============================================================================
// START SERVER
// ============================================================================

app.listen(

  PORT,

  "0.0.0.0",

  () => {

    console.log(
      `🔥 CELLCOUNT ELITE HOSPITAL rodando na porta ${PORT}`,
    );

    console.log(
      `🧠 Modelo: ${OPENAI_MODEL}`,
    );

    console.log(
      "🩸 IA hematológica online",
    );

    console.log(
      "🚀 PIPELINE ENTERPRISE V6 SAFE HYBRID ONLINE",
    );
  }
);