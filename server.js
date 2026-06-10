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

function normalizeMedicalResponse(
  data = {},
) {

  const findings =
    data.findings || {};

  const defaultAbsentFindings = `🟢 ELEMENTOS DE ALERTA NÃO EVIDENCIADOS

✓ Blastos inequívocos

✓ Bastonetes de Auer

✓ População blástica significativa

✓ Células imaturas críticas

✓ Esquizócitos relevantes`;

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

Criar obrigatoriamente seção específica chamada:

ELEMENTOS DE ALERTA NÃO EVIDENCIADOS

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
    "overview": "",
    "erythrocyteReview": "",
    "leukocyteReview": "",
    "plateletReview": "",
    "absentFindings": "ELEMENTOS DE ALERTA NÃO EVIDENCIADOS: Blastos inequívocos; células imaturas críticas; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.",
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

  "hematologicReasoning":
  "Texto obrigatório com no mínimo 500 caracteres. Explicar raciocínio hematológico especialista considerando morfologia celular, maturação, alterações reacionais, sinais de alerta e limitações da imagem.",

  "educationalImpact":
  "Texto obrigatório explicando valor educacional, limitações e quais exames ou dados complementares poderiam auxiliar.",

  "visualEvidence": {},
  "confidenceAnalysis": {},
  "safetyValidation": {},
  "consensusAnalysis": {},
  "clinicalCorrelation": {},
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

Se qualquer campo acima for true:

normalityBlocked = true

Adicionar justificativa em blockNormalReason.

morphologicRiskClass nunca pode ser CLASS_0_NORMAL.

Classificação mínima:
CLASS_2_ATYPICAL_POPULATION

Se houver monomorfismo, plasmócitos/plasmoblastos ou forte suspeita de clonalidade:
CLASS_3_POSSIBLE_CLONALITY

Se houver suspeita blástica:
CLASS_4_BLAST_SUSPICION

Nunca retornar normalidade se houver população atípica, plasmocitoide, monomórfica, imatura ou suspeita blástica.

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
imageQuality, visualExtraction, morphologyAnalysis, visualEvidence,
erythrocyteFindings, leukocyteFindings, plateletFindings, blastSuspicion,
overallAssessment, structuredReport, possibleClinicalCorrelations,
associatedEducationalHypotheses, clinicalCorrelationNeeds, clinicalMeaning,
educationalImpact, interpretiveSynthesis e hematologicReasoning.
`;

    const compactHospitalPrompt = `
    Você é uma IA hematológica educacional especializada em morfologia de sangue periférico.

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
    2. Eritrócitos: tamanho, cor, anisocitose, poiquilocitose, esquizócitos.
    3. Leucócitos: neutrófilos, linfócitos, monócitos, células reativas, atípicas ou imaturas.
    4. Plaquetas: quantidade, agregados, gigantismo.
    5. Elementos de alerta não evidenciados.

    ELEMENTOS DE ALERTA NÃO EVIDENCIADOS:
    Blastos inequívocos; bastonetes de Auer; população blástica significativa; células imaturas críticas; esquizócitos relevantes.

    Retorne obrigatoriamente JSON com:

    imageQuality,
    visualExtraction,
    normalityBlocked,
    blockNormalReason,
    morphologicRiskClass,
    reactiveLymphocytePattern,
    findings,

    visualEvidence,

    morphologyAnalysis,
    patternRecognition,
    interpretiveSynthesis,
    clinicalMeaning,
    hematologicReasoning,
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

    Marcar true apenas quando houver evidência visual observável.
    Nunca inferir características não visualizadas.

    Dentro de findings incluir obrigatoriamente:
    reactiveLymphocytes, atypicalLymphocytes, largeMononuclearCells, atypicalLymphocyteSubtype, downeyLikeCells, downeyType, plasmacytoidCells, plasmocytes, plasmablasts, monomorphicPopulation, immatureCells, blastSuspicion.

    Valores aceitos para atypicalLymphocyteSubtype:
    none, REACTIVE_LYMPHOCYTE_TYPICAL, DOWNEY_TYPE_I, DOWNEY_TYPE_II, DOWNEY_TYPE_III_IMMUNOBLASTOID, PLASMACYTOID_LYMPHOCYTE, ATYPICAL_LYMPHOCYTE_UNCLASSIFIED.

    Sempre escrever interpretiveSynthesis, clinicalMeaning, hematologicReasoning e educationalImpact em português do Brasil.
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
      max_tokens: 1800,
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

    const globalPattern =
      analyzeGlobalPattern(
        mergedAnalysis,
      );

    mergedAnalysis.globalPattern =
      globalPattern;

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
            "Resposta inflamatória ou infecciosa, conforme correlação com leucograma e clínica.",
            "Padrão reacional fisiológico, dependendo do contexto do paciente.",
            "Alterações hematológicas secundárias que exigem correlação com hemograma completo.",
            "Necessidade de revisão microscópica profissional para confirmação ou retificação dos achados.",
          ];


    mergedAnalysis.associatedEducationalHypotheses =
      Array.isArray(mergedAnalysis.associatedEducationalHypotheses) &&
      mergedAnalysis.associatedEducationalHypotheses.length > 0
        ? mergedAnalysis.associatedEducationalHypotheses
        : [
            "Padrão morfológico reacional relacionado a estímulos fisiológicos ou imunológicos.",
            "Alterações secundárias que devem ser avaliadas em conjunto com parâmetros hematimétricos.",
            "Possíveis respostas adaptativas da medula óssea conforme contexto clínico-laboratorial.",
            "Necessidade de excluir artefatos de lâmina, coloração ou preparação antes de qualquer conclusão.",
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

  function semanticAtypiaEngine(text = "") {

    const t = text.toLowerCase();

    return {

      largeMononuclearCells:
        t.includes("celulas mononucleares grandes") ||
        t.includes("celula mononuclear grande") ||
        t.includes("large mononuclear cells") ||
        t.includes("large mononuclear cell") ||
        t.includes("large mononuclear"),

      reactiveLymphocytes:
        t.includes("linfocitos reativos") ||
        t.includes("linfocito reativo") ||
        t.includes("reactive lymphocyte") ||
        t.includes("reactive lymphocytes") ||
        t.includes("reactive process") ||
        t.includes("reactive lymphocytosis") ||
        t.includes("virocito") ||
        t.includes("virocitos"),

      atypicalLymphocytes:
        t.includes("linfocitos atipicos") ||
        t.includes("linfocito atipico") ||
        t.includes("atypical lymphocyte") ||
        t.includes("atypical lymphocytes") ||
        t.includes("atypical cell") ||
        t.includes("atypical cells"),

      plasmacytoidCells:
        t.includes("plasmocitoide") ||
        t.includes("plasmocitoides") ||
        t.includes("plasmacytoid"),

      plasmocytes:
        t.includes("plasmocito") ||
        t.includes("plasmocitos") ||
        t.includes("plasma cell") ||
        t.includes("plasma cells"),

      plasmablasts:
        t.includes("plasmoblasto") ||
        t.includes("plasmoblastos") ||
        t.includes("plasmoblastico") ||
        t.includes("plasmablast") ||
        t.includes("plasmablasts"),

      monomorphicPopulation:
        t.includes("monomorfica") ||
        t.includes("monomorfismo") ||
        t.includes("monomorphic population") ||
        t.includes("monomorphic"),

      blastSuspicion:
        t.includes("blasto suspeito") ||
        t.includes("suspeita blastica") ||
        t.includes("blast suspicion") ||
        t.includes("suspicious blast"),
    };
  }

    const semanticFindings =
      semanticAtypiaEngine(
        extractedText,
      );

    console.log(
      'SEMANTIC FINDINGS',
      JSON.stringify(
        semanticFindings,
        null,
        2,
      ),
    );

    mergedAnalysis.findings = {
      ...mergedAnalysis.findings,

      largeMononuclearCells:
        mergedAnalysis.findings.largeMononuclearCells ||
        semanticFindings.largeMononuclearCells,

      reactiveLymphocytes:
        mergedAnalysis.findings.reactiveLymphocytes ||
        semanticFindings.reactiveLymphocytes,

      atypicalLymphocytes:
        mergedAnalysis.findings.atypicalLymphocytes ||
        semanticFindings.atypicalLymphocytes,

      plasmacytoidCells:
        mergedAnalysis.findings.plasmacytoidCells ||
        semanticFindings.plasmacytoidCells,

      plasmocytes:
        mergedAnalysis.findings.plasmocytes ||
        semanticFindings.plasmocytes,

      plasmablasts:
        mergedAnalysis.findings.plasmablasts ||
        semanticFindings.plasmablasts,

      monomorphicPopulation:
        mergedAnalysis.findings.monomorphicPopulation ||
        semanticFindings.monomorphicPopulation,

      blastSuspicion:
        mergedAnalysis.findings.blastSuspicion ||
        semanticFindings.blastSuspicion,
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

    if (
      riskClass === 'CLASS_1_LIMITED_FIELD_ATYPICAL_CELL'
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

      data.totalUses++;

      validation.result =
        sanitizeHematologyLanguage(
          validation.result,
        );

      console.log("================================");
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

      return res.json({

        success: true,

        analysis:
          validation.result,

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