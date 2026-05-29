// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// GPT-4o HEMATOLOGY ENTERPRISE SERVER V6 SAFE HYBRID
// ============================================================================

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
  "OPENAI:",
  process.env.OPENAI_API_KEY
    ? "CARREGADA"
    : "NÃO ENCONTRADA",
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
  "gpt-4o";

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

app.options("*", cors());

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

function normalizeMedicalResponse(
  data = {},
) {

  return {

    summary:
      data.summary || "",

    riskLevel:
      data.riskLevel || "Indefinido",

    observations:
      data.observations || "",

    alerts:
      Array.isArray(data.alerts)
        ? data.alerts
        : [],

    morphologies:
      Array.isArray(
        data.morphologies,
      )
        ? data.morphologies
        : [],

    counts:
      typeof data.counts === "object"
        ? data.counts
        : {},

    microscopyQualityScore:
      typeof data.microscopyQualityScore === "object"
        ? data.microscopyQualityScore
        : {},

    educationalPearls:
      Array.isArray(
        data.educationalPearls,
      )
        ? data.educationalPearls
        : [],

    heatmapRegions:
      Array.isArray(
        data.heatmapRegions,
      )
        ? data.heatmapRegions
        : [],

    imageQuality:
      typeof data.imageQuality ===
      "object"
        ? data.imageQuality
        : {},

    erythrocyteFindings:
      typeof data
        .erythrocyteFindings ===
      "object"
        ? data
            .erythrocyteFindings
        : {},

    leukocyteFindings:
      typeof data
        .leukocyteFindings ===
      "object"
        ? data
            .leukocyteFindings
        : {},

    plateletFindings:
      typeof data
        .plateletFindings ===
      "object"
        ? data
            .plateletFindings
        : {},

    blastSuspicion:
      typeof data
        .blastSuspicion ===
      "object"
        ? data
            .blastSuspicion
        : {},

    overallAssessment:
      typeof data
        .overallAssessment ===
      "object"
        ? data
            .overallAssessment
        : {},

    structuredReport:
      typeof data
        .structuredReport ===
      "object"
        ? data
            .structuredReport
        : {},

    differentialDiagnosis:
      Array.isArray(
        data.differentialDiagnosis,
      )
        ? data
            .differentialDiagnosis
        : [],

    criticalFlags:
      Array.isArray(
        data.criticalFlags,
      )
        ? data.criticalFlags
        : [],

    analysisSource:
      data.analysisSource ||
      "ai_visual",

    manualCounts:
      typeof data.manualCounts ===
      "object"
        ? data.manualCounts
        : {},

    aiDetectedCounts:
      typeof data.aiDetectedCounts ===
      "object"
        ? data.aiDetectedCounts
        : {},

    hybridValidation:
      typeof data.hybridValidation ===
      "object"
        ? data.hybridValidation
        : {},

    ...data,
  };
}

// ============================================================================
// AUTH
// ============================================================================

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
- revisão microscópica recomendada

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

ETAPA 3 — MORPHOLOGY ANALYSIS

Avaliar:

ERITRÓCITOS:
- anisocitose
- poiquilocitose
- policromasia
- hipocromia
- macrocitose
- microcitose
- esquizócitos
- dacriócitos
- acantócitos
- codócitos
- eliptócitos
- drepanócitos
- inclusões eritrocitárias

LEUCÓCITOS:
- relação núcleo/citoplasma
- cromatina
- nucléolos
- granulação
- vacuolização
- segmentação
- toxicidade
- displasia
- imaturidade

PLAQUETAS:
- número
- agregação
- gigantismo
- anisoplaquetose

GERAR morphologyAnalysis.summary:

Texto obrigatório.

Descrever como especialista:
- população celular predominante
- características nucleares
- padrão de cromatina
- citoplasma
- granulações
- alterações eritrocitárias
- distribuição plaquetária

Não interpretar doenças aqui.

Apenas:
"O que é observado na lâmina".

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
  "morphologyAnalysis": {},

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
        maxTiles: Number(process.env.GPT_IMAGE_TILES || 0),
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

    const visualStart = performance.now();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.12,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${hospitalPrompt}

MODO TURBO ENTERPRISE:
Gerar a estrutura completa obrigatória em uma única chamada, com escrita acadêmica, segura e não diagnóstica. Nunca retornar campos vazios.`,
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

    const parsed = safeJsonParse(
      completion?.choices?.[0]?.message?.content || "{}",
    );

    const visualTiming = logStep(requestId, "OPENAI TURBO ANALYSIS", visualStart);

    const mergedAnalysis = normalizeMedicalResponse({
      ...parsed,
      analysisSource,
      manualCounts,
      manualMetadata,
    });

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
    const extractedText = buildSemanticText(mergedAnalysis);

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

    const confidenceStart = performance.now();
    const confidenceAnalysis = buildConfidenceAnalysis({
      analysis: mergedAnalysis,
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

      data.totalUses++;

      // ====================================================================
      // RESPONSE
      // ====================================================================

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

Você é o HemaAsk AI.

Atue como:
- professor universitário de hematologia
- hematologista especialista
- tutor acadêmico avançado

Explique imagens, exames e perguntas.

OBJETIVO:
Ensinar o raciocínio hematológico.

Responder sempre:

1. O que estou observando
2. Explicação morfológica
3. Significado hematológico
4. Possíveis correlações associadas
5. Diferenciais educacionais
6. Limitações
7. Quando procurar validação profissional


REGRAS:
- Não emitir diagnóstico definitivo
- Não substituir profissional habilitado
- Usar "pode sugerir", "pode estar associado"
- Explicar como professor experiente


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