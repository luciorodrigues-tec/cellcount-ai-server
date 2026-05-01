const express = require("express");
const multer = require("multer");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: "25mb" }));

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || "cellcount_v13_token_seguro";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const users = new Map();

const PRODUCTS = {
  cellcount_100_ai_credits: 100,
  cellcount_1000_ai_credits: 1000,
};

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();

  if (token !== API_TOKEN) {
    return res.status(401).json({ error: "Token inválido" });
  }

  next();
}

function getUserId(req) {
  return req.headers["x-user-id"] || "anonymous_device";
}

function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, {
      userId,
      freeUses: 20,
      credits: 0,
      totalUses: 0,
      purchases: [],
      learningCases: [],
    });
  }

  return users.get(userId);
}

function publicStatus(user) {
  return {
    userId: user.userId,
    freeUses: user.freeUses,
    credits: user.credits,
    totalAvailable: user.freeUses + user.credits,
    totalUses: user.totalUses,
  };
}

function consumeAiCredit(user) {
  if (user.freeUses > 0) {
    user.freeUses -= 1;
    user.totalUses += 1;
    return;
  }

  if (user.credits > 0) {
    user.credits -= 1;
    user.totalUses += 1;
    return;
  }

  throw new Error("Sem usos gratuitos ou créditos disponíveis.");
}

function imageToDataUrl(file) {
  const mime = file.mimetype || "image/jpeg";
  const base64 = file.buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}

function safeJsonParse(text) {
  try {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (_) {
    return null;
  }
}

const hospitalPrompt = `
Você é um assistente acadêmico avançado de apoio em hematologia laboratorial, morfologia celular e triagem de esfregaços sanguíneos.

OBJETIVO:
Gerar uma avaliação morfológica estruturada, conservadora, educacional e revisável por profissional habilitado.

LIMITAÇÃO OBRIGATÓRIA:
Você NÃO fornece diagnóstico definitivo.
Você NÃO substitui médico, biomédico, farmacêutico, hematologista ou profissional habilitado.
Você NÃO deve afirmar leucemia, síndrome mielodisplásica ou neoplasia como certeza.
Você deve indicar revisão humana quando houver achado suspeito.

ANÁLISE OBRIGATÓRIA:
1. Qualidade da imagem:
- foco
- coloração
- iluminação
- artefatos
- campo representativo
- limitação técnica

2. Triagem de blastos:
Sempre procurar célula imatura/blástica.
Não omitir blasto.
Não chamar automaticamente de linfócito quando houver:
- núcleo grande
- alta relação núcleo/citoplasma
- cromatina fina, frouxa ou laxa
- nucléolo possível ou evidente
- citoplasma escasso ou basofílico
- ausência de granulações maduras
- célula mononuclear grande azulada/arroxeada

Se houver dúvida, classifique como:
"indeterminado com suspeita de célula imatura/blástica".

3. Diferencial obrigatório:
- blasto
- linfócito reativo
- eritroblasto
- célula linfoide madura
- artefato / célula fora de foco

4. Hemácias:
Avaliar anisocitose, poiquilocitose, hipocromia, microcitose, macrocitose, policromasia, codócitos, eliptócitos, esquizócitos, drepanócitos, rouleaux e artefatos.

5. Leucócitos:
Avaliar maturação granulocítica, segmentados, bastonetes, linfócitos, monócitos, eosinófilos, basófilos e células imaturas.

6. Plaquetas:
Avaliar presença, agregação e estimativa qualitativa.

7. Risco:
Classificar suspeita morfológica como:
- baixo
- moderado
- alto

8. Revisão humana:
Se houver suspeita moderada ou alta de blasto/célula imatura, requiresHumanReview deve ser true.

FORMATO DE SAÍDA:
Responder SOMENTE em JSON válido, sem markdown, sem texto fora do JSON.

JSON obrigatório:
{
  "imageQuality": {
    "overall": "boa | moderada | ruim",
    "focus": "adequado | parcial | inadequado",
    "staining": "adequada | parcial | inadequada",
    "artifacts": ["..."],
    "limitations": ["..."]
  },
  "blastSuspicion": {
    "present": true,
    "score": 0,
    "riskLevel": "baixo | moderado | alto",
    "confidence": "baixo | moderado | alto",
    "approximateSuspiciousCells": 0,
    "morphologicReasons": ["..."]
  },
  "differential": [
    {
      "hypothesis": "Blasto",
      "probability": 0,
      "supportingFindings": ["..."],
      "againstFindings": ["..."]
    }
  ],
  "erythrocyteFindings": {
    "summary": "...",
    "findings": ["..."]
  },
  "leukocyteFindings": {
    "summary": "...",
    "findings": ["..."]
  },
  "plateletFindings": {
    "summary": "...",
    "findings": ["..."]
  },
  "morphologyFlags": ["..."],
  "requiresHumanReview": true,
  "alert": "...",
  "educationalConclusion": "...",
  "plainTextReport": "..."
}

REGRAS:
- score deve ir de 0 a 100.
- Se houver célula grande mononuclear com cromatina frouxa e alta relação núcleo/citoplasma, score não deve ser zero.
- Se imagem for limitada, declarar limitação.
- Resposta em português do Brasil.
`;

app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "CellCount Backend Hospital IA",
    endpoints: ["/user/status", "/purchase/verify", "/analyze-slide", "/learning/save-case"],
  });
});

app.get("/user/status", auth, (req, res) => {
  const user = getUser(getUserId(req));
  res.json(publicStatus(user));
});

app.post("/analyze-slide", auth, upload.any(), async (req, res) => {
  try {
    const user = getUser(getUserId(req));

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    if (req.files.length > 3) {
      return res.status(400).json({ error: "Envie no máximo 3 imagens." });
    }

    consumeAiCredit(user);

    const imageParts = req.files.map((file) => ({
      type: "image_url",
      image_url: {
        url: imageToDataUrl(file),
      },
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: hospitalPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analise as imagens da lâmina. Priorize triagem de célula imatura/blástica, qualidade da imagem e diferencial morfológico. Retorne somente JSON válido.",
            },
            ...imageParts,
          ],
        },
      ],
    });

    const raw =
      response.choices?.[0]?.message?.content ||
      "";

    const structured = safeJsonParse(raw);

    if (!structured) {
      return res.json({
        result: raw || "Não foi possível gerar análise estruturada.",
        structured: null,
        requiresHumanReview: true,
        ...publicStatus(user),
      });
    }

    res.json({
      result: structured.plainTextReport || structured.educationalConclusion || "Análise gerada.",
      structured,
      requiresHumanReview: structured.requiresHumanReview === true,
      ...publicStatus(user),
    });
  } catch (error) {
    console.error("Erro /analyze-slide:", error);

    res.status(500).json({
      error: error.message || "Erro ao analisar lâmina.",
    });
  }
});

app.post("/purchase/verify", auth, async (req, res) => {
  try {
    const user = getUser(getUserId(req));
    const { productId, purchaseToken } = req.body;

    if (!productId || !purchaseToken) {
      return res.status(400).json({
        error: "productId e purchaseToken são obrigatórios.",
      });
    }

    if (!PRODUCTS[productId]) {
      return res.status(400).json({
        error: "Produto inválido.",
      });
    }

    if (user.purchases.includes(purchaseToken)) {
      return res.status(409).json({
        error: "Compra já utilizada.",
      });
    }

    user.credits += PRODUCTS[productId];
    user.purchases.push(purchaseToken);

    res.json({
      success: true,
      addedCredits: PRODUCTS[productId],
      ...publicStatus(user),
    });
  } catch (error) {
    console.error("Erro /purchase/verify:", error);

    res.status(500).json({
      error: error.message || "Erro ao verificar compra.",
    });
  }
});

app.post("/learning/save-case", auth, (req, res) => {
  try {
    const user = getUser(getUserId(req));

    const item = {
      createdAt: new Date().toISOString(),
      validation: req.body.validation || "",
      correction: req.body.correction || "",
      aiResult: req.body.aiResult || "",
      structured: req.body.structured || null,
      imageCount: req.body.imageCount || 0,
    };

    user.learningCases.push(item);

    res.json({
      success: true,
      message: "Caso salvo para aprendizado assistido.",
      totalCases: user.learningCases.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Erro ao salvar caso.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`CellCount Backend Hospital IA rodando na porta ${PORT}`);
});