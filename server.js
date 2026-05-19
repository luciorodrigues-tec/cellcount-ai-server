// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// GPT-4o HEMATOLOGY ENTERPRISE SERVER
// ============================================================================

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

// ============================================================================
// ENV
// ============================================================================

dotenv.config();

console.log(
  "OPENAI:",
  process.env.OPENAI_API_KEY
    ? "CARREGADA"
    : "NÃO ENCONTRADA"
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

const AUTH_TOKEN =
  process.env.AUTH_TOKEN ||
  "cellcount_v13_token_seguro";

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

    origin: '*',

    methods: [

      'GET',
      'POST',
      'PUT',
      'DELETE',
      'OPTIONS',
    ],

    allowedHeaders: [

      'Content-Type',
      'Authorization',
      'x-user-id',
    ],
  }),
);

app.options('*', cors());

// ============================================================================
// EXPRESS
// ============================================================================

app.use(express.json({

  limit: '50mb',
}));

app.use(express.urlencoded({

  extended: true,

  limit: '50mb',
}));

// ============================================================================
// MULTER
// ============================================================================

const upload = multer({

  storage: multer.memoryStorage(),

  limits: {

    fileSize: 25 * 1024 * 1024,

    files: 4,
  },
});

// ============================================================================
// USERS
// ============================================================================

const users = new Map();

// ============================================================================
// AUTH
// ============================================================================

function auth(
  req,
  res,
  next,
) {

  try {

    const header =
      req.headers.authorization || "";

    const token =
      header
        .replace("Bearer ", "")
        .trim();

    if (token !== AUTH_TOKEN) {

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
// MIME
// ============================================================================

function mimeFromFile(file) {

  if (
    file?.mimetype &&
    file.mimetype.startsWith(
      "image/"
    )
  ) {

    return file.mimetype;
  }

  return "image/jpeg";
}

// ============================================================================
// HOSPITAL SUPER PROMPT
// ============================================================================

const hospitalPrompt = `

VOCÊ É UMA IA HEMATOLÓGICA HOSPITALAR PREMIUM.

ESPECIALIZAÇÃO:
- Hematologia clínica
- Hematopatologia
- Morfologia hematológica
- Citologia hematológica
- Medicina laboratorial
- Análises clínicas
- Leucemias agudas e crônicas
- Síndromes mielodisplásicas
- Alterações eritrocitárias
- Diagnóstico morfológico hematológico

SEU COMPORTAMENTO DEVE SIMULAR:

- Médico hematologista experiente
- Morfologista hematológico hospitalar
- Especialista em microscopia hematológica
- Professor universitário hematologia
- Pós-doutorado em análises clínicas

IMPORTANTE:
A análise é EDUCACIONAL.
NÃO emitir diagnóstico definitivo.
NÃO substituir profissional habilitado.
NÃO substituir avaliação médica especializada.
Os resultados devem ser interpretados junto ao contexto clínico e laboratorial do paciente.

======================================================================
OBJETIVO
======================================================================

Analisar imagens de esfregaço sanguíneo periférico.

Avaliar:
- leucócitos
- hemácias
- plaquetas
- artefatos
- qualidade microscópica
- coerência morfológica
- correlação hematológica

======================================================================
RACIOCÍNIO MORFOLÓGICO AVANÇADO
======================================================================

A IA deve agir como morfologista hematológico experiente.

Para CADA alteração detectada:
- justificar critérios morfológicos observados
- explicar por que considera verdadeiro achado
- diferenciar alterações reais de artefatos
- discutir limitações da análise
- correlacionar achados entre si

NUNCA responder apenas:
- "anisocitose leve"
- "poiquilocitose discreta"
- "alterações inespecíficas"

A IA deve:
- descrever o padrão observado
- correlacionar os achados
- discutir coerência hematológica

EXEMPLO CORRETO:
"Observa-se discreta anisopoquilocitose com presença ocasional de codócitos e policromasia leve."

EXEMPLO INCORRETO:
"Anisocitose leve."

======================================================================
ANÁLISE MULTICAMPO
======================================================================

Quando múltiplas imagens forem enviadas:

- correlacionar TODOS os campos
- confirmar repetição dos achados
- detectar heterogeneidade
- evitar conclusões baseadas em único campo
- aumentar confiança apenas quando achados forem repetidos

======================================================================
DESCRIÇÃO CELULAR OBRIGATÓRIA
======================================================================

Quando identificar células suspeitas,
descrever SEMPRE:

- cromatina
- nucléolos
- citoplasma
- granulações
- vacuolização
- relação núcleo/citoplasma
- segmentação nuclear
- regularidade de membrana

======================================================================
BLASTOS
======================================================================

SER EXTREMAMENTE RIGOROSO.

Diferenciar:
- linfócito reacional
- monócito ativado
- célula degenerada
- artefato
- blasto verdadeiro

Blastos verdadeiros geralmente possuem:
- cromatina frouxa
- nucléolos evidentes
- alta relação núcleo/citoplasma
- contornos delicados
- aspecto imaturo

Quando houver critérios suficientes,
a IA pode sugerir:
- suspeita de blastos
- células imaturas suspeitas
- população atípica

Desde que:
- descreva os critérios observados
- informe nível de confiança
- recomende correlação especializada

REDUZIR confiança se:
- cromatina condensada
- imagem desfocada
- nucléolo ausente
- foco inadequado

======================================================================
ESQUIZÓCITOS
======================================================================

Só sugerir:
- quando fragmentos típicos forem repetidos
- múltiplos campos
- fragmentação verdadeira

NÃO sugerir:
- hemácia deformada isolada
- artefato
- hemácia dobrada

======================================================================
ERITRÓCITOS
======================================================================

Avaliar:
- anisocitose
- poiquilocitose
- policromasia
- hipocromia
- macrocitose
- microcitose
- rouleaux
- drepanócitos
- esquizócitos
- codócitos
- acantócitos
- equinócitos
- eliptócitos
- dacriócitos
- estomatócitos
- corpos de Howell-Jolly

======================================================================
LEUCÓCITOS
======================================================================

Avaliar:
- desvio à esquerda
- toxicidade
- vacuolização
- hipersegmentação
- blastos
- atipias
- linfócitos reativos
- granulações tóxicas

======================================================================
PLAQUETAS
======================================================================

Avaliar:
- agregados
- macroplaquetas
- trombocitopenia aparente
- pseudoplaquetopenia

======================================================================
CORRELAÇÃO HEMATOLÓGICA
======================================================================

A IA deve correlacionar:
- série branca
- série vermelha
- plaquetas
- qualidade microscópica

Discutir:
- coerência dos achados
- limitações
- padrões hematológicos possíveis

======================================================================
VALIDAÇÃO DE COERÊNCIA
======================================================================

NÃO permitir:
- blasto com cromatina madura
- esquizócito sem fragmentação típica
- displasia baseada em célula isolada
- desvio à esquerda sem imaturas

======================================================================
QUALIDADE MICROSCÓPICA
======================================================================

Avaliar:
- foco
- coloração
- representatividade
- iluminação
- artefatos
- compressão
- resolução

======================================================================
FORMATO OBRIGATÓRIO
======================================================================

RETORNAR APENAS JSON VÁLIDO.

NUNCA markdown.
NUNCA comentários.
NUNCA texto extra.

FORMATO:

{
  "summary": "",

  "riskLevel": "",

  "observations": "",

  "erythrocyteFindings": "",

  "leukocyteFindings": "",

  "plateletFindings": "",

  "morphologicInterpretation": "",

  "hematologicCorrelation": "",

  "suspectedConditions": [],

  "alerts": [],

  "morphologies": [],

  "counts": {

    "Blasto": 0,
    "Promielócito": 0,
    "Mielócito": 0,
    "Metamielócito": 0,
    "Bastonete": 0,
    "Segmentado": 0,
    "Linfócito": 0,
    "Linfócito Reativo": 0,
    "Monócito": 0,
    "Eosinófilo": 0,
    "Basófilo": 0,
    "Eritroblasto": 0
  },

  "microscopyQualityScore": {

    "focus": 0,
    "staining": 0,
    "artifactInterference": 0,
    "representativity": 0,
    "overall": 0
  },

  "morphologicConfidenceMatrix": {

    "blastConfidence": 0,
    "schistocyteConfidence": 0,
    "dysplasiaConfidence": 0,
    "leftShiftConfidence": 0
  },

  "hematologicUrgency": {

    "level": "",

    "requiresImmediateReview": false,

    "reasons": []
  },

  "educationalPearls": []
}

EXEMPLO DE ESTILO ESPERADO:

"Observa-se discreta anisopoquilocitose com predomínio de hemácias alongadas e ocasionais codócitos. Série branca sem evidência clara de blastos; células linfocitárias apresentam cromatina condensada e ausência de nucléolos evidentes, favorecendo padrão maduro. Plaquetas presentes em quantidade aparentemente preservada, com pequenos agregados ocasionais."

`;

// ============================================================================
// VALIDATION
// ============================================================================

function validateAIResult(result) {

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
// OPENAI ANALYSIS
// ============================================================================

async function analyzeWithOpenAI(
  images,
) {

  try {

    const content = [

      {
        type: "text",

        text:
          hospitalPrompt,
      },
    ];

    for (const file of images) {

      const base64 =
        file.buffer.toString(
          "base64"
        );

      content.push({

        type: "image_url",

        image_url: {

          url:
            `data:${mimeFromFile(file)};base64,${base64}`,
        },
      });
    }

    const response =
      await openai.chat.completions.create({

        model:
          OPENAI_MODEL,

        temperature: 0.15,

        response_format: {

          type:
            "json_object",
        },

        messages: [

          {
            role: "user",

            content,
          },
        ],
      });

    const text =
      response.choices?.[0]
        ?.message?.content || "{}";

    try {

      const cleaned =
        text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();

      return JSON.parse(
        cleaned
      );

    } catch (error) {

      console.error(
        "ERRO JSON:",
        text
      );

      return {

        summary:
          "Erro interpretação IA.",

        riskLevel:
          "Indeterminado",

        observations:
          "Falha ao interpretar resposta da IA.",

        alerts: [

          "JSON inválido retornado pela IA",
        ],

        morphologies: [],

        counts: {},
      };
    }

  } catch (error) {

    console.error(
      "Erro OpenAI:",
      error.message
    );

    throw error;
  }
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
    'image',
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

      console.log(
        `🔬 ${uploadedFiles.length} imagens recebidas`
      );

      const structured =
        await analyzeWithOpenAI(
          uploadedFiles,
        );

      const validation =
        validateAIResult(
          structured
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
        },
      });

    } catch (error) {

      console.error(
        "Erro analyze-slide:",
        error
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
// START
// ============================================================================

app.listen(

  PORT,

  '0.0.0.0',

  () => {

    console.log(
      `🔥 CELLCOUNT ELITE HOSPITAL rodando na porta ${PORT}`
    );

    console.log(
      `🧠 Modelo: ${OPENAI_MODEL}`
    );

    console.log(
      `🩸 IA hematológica online`
    );
  }
);