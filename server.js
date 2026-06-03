// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// CELLCOUNT HEMATOLOGY ENTERPRISE SERVER V6 SAFE HYBRID
// ============================================================================

import validateConsistency
  from "./utils/validateConsistency.js";

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

function normalizeMedicalResponse(
  data = {},
) {

  return {

  normalityBlocked:
    data.normalityBlocked || false,

  blockNormalReason:
    Array.isArray(data.blockNormalReason)
      ? data.blockNormalReason
      : [],

  morphologicRiskClass:
    data.morphologicRiskClass ||
    "CLASS_0_NORMAL",

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

    findings: {

      largeMononuclearCells:
        Boolean(
          data.findings?.largeMononuclearCells
        ),

      plasmacytoidCells:
        Boolean(
          data.findings?.plasmacytoidCells
        ),

      plasmocytes:
        Boolean(
          data.findings?.plasmocytes
        ),

      plasmablasts:
        Boolean(
          data.findings?.plasmablasts
        ),

      atypicalLymphocytes:
        Boolean(
          data.findings?.atypicalLymphocytes
        ),

      monomorphicPopulation:
        Boolean(
          data.findings?.monomorphicPopulation
        ),

      immatureCells:
        Boolean(
          data.findings?.immatureCells
        ),

      blastSuspicion:
        Boolean(
          data.findings?.blastSuspicion
        ),
    },

    morphologyAnalysis: {

      overview:
        data?.morphologyAnalysis?.overview || "",

      erythrocyteReview:
        data?.morphologyAnalysis?.erythrocyteReview || "",

      leukocyteReview:
        data?.morphologyAnalysis?.leukocyteReview || "",

      plateletReview:
        data?.morphologyAnalysis?.plateletReview || "",

      absentFindings:
        data?.morphologyAnalysis?.absentFindings || "",

      biologicalInterpretation:
        data?.morphologyAnalysis?.biologicalInterpretation || "",

      differentialDiagnosis:
        data?.morphologyAnalysis?.differentialDiagnosis || "",

      summary:
        data?.morphologyAnalysis?.summary || "",
    },

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

    patternRecognition: {

      erythrocytePattern:
        data?.patternRecognition?.erythrocytePattern || "",

      leukocytePattern:
        data?.patternRecognition?.leukocytePattern || "",

      plateletPattern:
        data?.patternRecognition?.plateletPattern || "",

      artifactPattern:
        data?.patternRecognition?.artifactPattern || "",

      overallPattern:
        data?.patternRecognition?.overallPattern || "",
    },

    interpretiveSynthesis:
      data?.interpretiveSynthesis || "",

    clinicalMeaning:
      data?.clinicalMeaning || "",

    hematologicReasoning:
      data?.hematologicReasoning || "",

    educationalImpact:
      data?.educationalImpact || "",

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

  rawResponse: data,
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

ACHADOS IMPORTANTES NÃO IDENTIFICADOS

Criar obrigatoriamente seção específica contendo:

- ausência de bastonetes de Auer
- ausência de blastos inequívocos
- ausência de esquizócitos
- ausência de rouleaux
- ausência de displasia marcante

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

    "monomorphicPopulation": false,

    "immatureCells": false,

    "blastSuspicion": false
  },

  "morphologyAnalysis": {
    "overview": "",
    "erythrocyteReview": "",
    "leukocyteReview": "",
    "plateletReview": "",
    "absentFindings": "",
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
Gerar a estrutura completa obrigatória em uma única chamada, com escrita acadêmica, segura e não diagnóstica.

Nunca retornar campos vazios.
Nunca retornar morphologyAnalysis vazio.
Nunca retornar patternRecognition vazio.
Todos os campos obrigatórios devem ser preenchidos.
Quando um achado não estiver presente, descrever explicitamente a ausência.
Quando a imagem não permitir avaliação segura, informar a limitação no próprio campo.
Nunca usar null.
Nunca usar undefined.
Nunca usar objeto vazio {} em campos obrigatórios.
Nunca usar array vazio [] quando houver recomendação educacional aplicável.`,
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

    console.log("================================");
    console.log("RAW GPT RESPONSE");
    console.log(JSON.stringify(parsed, null, 2));
    console.log("================================");

    const visualTiming = logStep(
      requestId,
      "OPENAI TURBO ANALYSIS",
      visualStart,
    );

    const mergedAnalysis = normalizeMedicalResponse({
      ...parsed,
      analysisSource,
      manualCounts,
      manualMetadata,
    });

    console.log("================================");
    console.log("NORMALIZED RESPONSE");
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
    const extractedText = buildSemanticText(mergedAnalysis);

  function semanticAtypiaEngine(text = "") {
    const t = text.toLowerCase();

    return {
      largeMononuclearCells:
        t.includes("celulas mononucleares grandes") ||
        t.includes("celulas grandes"),

      plasmacytoidCells:
        t.includes("plasmocitoide") ||
        t.includes("plasmocitoides"),

      plasmocytes:
        t.includes("plasmocito") ||
        t.includes("plasmocitos"),

      plasmablasts:
        t.includes("plasmoblasto") ||
        t.includes("plasmoblastos") ||
        t.includes("plasmoblastico"),

      monomorphicPopulation:
        t.includes("monomorfica") ||
        t.includes("monomorfismo"),

      blastSuspicion:
        t.includes("blasto suspeito") ||
        t.includes("suspeita blastica"),
    };
  }

    const semanticFindings =
      semanticAtypiaEngine(
        extractedText,
      );

    mergedAnalysis.findings = {
      ...mergedAnalysis.findings,

      largeMononuclearCells:
        mergedAnalysis.findings.largeMononuclearCells ||
        semanticFindings.largeMononuclearCells,

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

      validation.result =
        validateConsistency(
          validation.result,
        );

      if (
        validation.result.findings?.blastSuspicion
      ) {

        validation.result.morphologicRiskClass =
          "CLASS_4_BLAST_SUSPICION";
      }

      if (
        validation.result.findings?.plasmablasts &&
        validation.result.findings?.monomorphicPopulation
      ) {

        validation.result.morphologicRiskClass =
          "CLASS_5_HIGH_NEOPLASTIC_SUSPICION";
      }

      const reportText =
        JSON.stringify(
          validation.result,
        ).toLowerCase();

      if (

        validation.result
          .normalityBlocked &&

        (
          reportText.includes("padrão hematológico normal") ||
          reportText.includes("padrao hematologico normal") ||
          reportText.includes("sem alterações patológicas") ||
          reportText.includes("sem alteracoes patologicas") ||
          reportText.includes("morfologia normal") ||
          reportText.includes("estado hematológico normal") ||
          reportText.includes("estado hematologico normal")
        )

      ) {

        validation.result.criticalFlags =
          Array.isArray(validation.result.criticalFlags)
            ? validation.result.criticalFlags
            : [];

        validation.result.criticalFlags.push(
          "Contradição interna detectada"
        );

        validation.result.overallAssessment =
          validation.result.overallAssessment || {};

        validation.result.overallAssessment.requiresHumanReview =
          true;
      }

      data.totalUses++;

      // ====================================================================
      // RESPONSE
      // ====================================================================

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