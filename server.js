import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import OpenAI from "openai";
import { google } from "googleapis";

dotenv.config();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PACKAGE_NAME =
  process.env.PACKAGE_NAME || "com.rodrigueslucio.cellcountai";

const PRODUCTS = {
  cellcount_100_ai_credits: 100,
  cellcount_1000_ai_credits: 1000,
};

const DB_FILE = "./cellcount_db.json";

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    return { users: {}, usedTokens: {} };
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(db, userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      freeUses: 20,
      credits: 0,
      totalUses: 0,
      createdAt: new Date().toISOString(),
    };
  }
  return db.users[userId];
}

function getUserId(req) {
  return req.headers["x-user-id"] || "anonymous_device";
}

function validateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Token inválido" });
  }

  next();
}

async function getAndroidPublisher() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON não configurado");
  }

  const credentials = JSON.parse(raw);

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });

  return google.androidpublisher({
    version: "v3",
    auth,
  });
}

async function verifyGooglePurchase(productId, purchaseToken) {
  const androidpublisher = await getAndroidPublisher();

  const result = await androidpublisher.purchases.products.get({
    packageName: PACKAGE_NAME,
    productId,
    token: purchaseToken,
  });

  const purchase = result.data;

  if (purchase.purchaseState !== 0) {
    throw new Error("Compra não está aprovada");
  }

  await androidpublisher.purchases.products.consume({
    packageName: PACKAGE_NAME,
    productId,
    token: purchaseToken,
  });

  return purchase;
}

const superPrompt = `
Você é um assistente acadêmico de apoio em morfologia hematológica, hematologia laboratorial e ensino de esfregaço sanguíneo periférico.

Objetivo:
Produzir uma análise educacional, descritiva e acadêmica da imagem ou das imagens enviadas, com linguagem técnica de alto nível, sem diagnóstico definitivo.

Regras de segurança:
Não fornecer diagnóstico definitivo.
Não substituir profissional habilitado.
Não afirmar doença como certeza.
Não inventar achados não visíveis.
Sempre diferenciar: achado observado, padrão compatível, limitação técnica e exame necessário para confirmação.
Se houver incerteza, declarar incerteza.
A resposta deve ser em português do Brasil.
Retorne texto puro, sem JSON e sem markdown.

Estrutura obrigatória:

ANÁLISE MORFOLÓGICA HEMATOLÓGICA AVANÇADA:

1. Qualidade técnica das imagens:
2. Comparação entre os campos:
3. Contagem celular estimada:
4. Avaliação eritrocitária:
5. Padrões compatíveis com anemia:
6. Avaliação leucocitária:
7. Padrões compatíveis com infecção ou inflamação:
8. Sinais de alerta hematológico:
9. Avaliação plaquetária:
10. Diagnósticos diferenciais morfológicos:
11. Exames complementares recomendados:
12. Classificação de prioridade:
13. Fontes acadêmicas de referência:
14. Parecer acadêmico final:

Aviso final:
Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado, revisão microscópica completa, hemograma, exames complementares ou avaliação clínica.
`;

app.get("/", (_, res) => {
  res.json({
    status: "online",
    app: "CellCount AI Backend Hospital",
    packageName: PACKAGE_NAME,
  });
});

app.get("/user/status", validateToken, (req, res) => {
  const db = loadDb();
  const userId = getUserId(req);
  const user = getUser(db, userId);

  saveDb(db);

  res.json({
    userId,
    freeUses: user.freeUses,
    credits: user.credits,
    totalAvailable: user.freeUses + user.credits,
    totalUses: user.totalUses,
  });
});

app.post("/purchase/verify", validateToken, async (req, res) => {
  try {
    const { productId, purchaseToken } = req.body;

    if (!productId || !purchaseToken) {
      return res.status(400).json({
        error: "productId e purchaseToken são obrigatórios",
      });
    }

    if (!PRODUCTS[productId]) {
      return res.status(400).json({
        error: "Produto inválido",
      });
    }

    const db = loadDb();
    const userId = getUserId(req);
    const user = getUser(db, userId);

    if (db.usedTokens[purchaseToken]) {
      return res.status(409).json({
        error: "Compra já utilizada",
      });
    }

    await verifyGooglePurchase(productId, purchaseToken);

    const creditsToAdd = PRODUCTS[productId];

    user.credits += creditsToAdd;
    db.usedTokens[purchaseToken] = {
      userId,
      productId,
      creditsAdded: creditsToAdd,
      usedAt: new Date().toISOString(),
    };

    saveDb(db);

    res.json({
      success: true,
      creditsAdded: creditsToAdd,
      freeUses: user.freeUses,
      credits: user.credits,
      totalAvailable: user.freeUses + user.credits,
    });
  } catch (error) {
    console.error("Erro purchase verify:", error);

    res.status(500).json({
      error: error.message || "Erro ao verificar compra",
    });
  }
});

function consumeAiCredit(db, user) {
  if (user.freeUses > 0) {
    user.freeUses -= 1;
    user.totalUses += 1;
    return "free";
  }

  if (user.credits > 0) {
    user.credits -= 1;
    user.totalUses += 1;
    return "credit";
  }

  return null;
}

function refundAiCredit(user, type) {
  if (type === "free") user.freeUses += 1;
  if (type === "credit") user.credits += 1;
  if (type) user.totalUses = Math.max(0, user.totalUses - 1);
}

app.post(
  "/analyze-slide",
  validateToken,
  upload.any(),
  async (req, res) => {
    const db = loadDb();
    const userId = getUserId(req);
    const user = getUser(db, userId);

    let consumedType = null;

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "Nenhuma imagem enviada",
        });
      }

      consumedType = consumeAiCredit(db, user);

      if (!consumedType) {
        saveDb(db);
        return res.status(402).json({
          error: "Sem usos gratuitos ou créditos disponíveis",
          freeUses: user.freeUses,
          credits: user.credits,
        });
      }

      saveDb(db);

      const content = [
        {
          type: "input_text",
          text: superPrompt,
        },
      ];

      for (const file of req.files.slice(0, 3)) {
        let mime = file.mimetype || "image/jpeg";

        if (mime === "application/octet-stream") {
          mime = "image/jpeg";
        }

        if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
          mime = "image/jpeg";
        }

        const base64 = file.buffer.toString("base64");

        content.push({
          type: "input_image",
          image_url: `data:${mime};base64,${base64}`,
        });
      }

      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        input: [
          {
            role: "user",
            content,
          },
        ],
      });

      res.json({
        result: response.output_text.trim(),
        freeUses: user.freeUses,
        credits: user.credits,
        totalAvailable: user.freeUses + user.credits,
      });
    } catch (error) {
      refundAiCredit(user, consumedType);
      saveDb(db);

      console.error("Erro IA:", error);

      res.status(500).json({
        error: error.message || "Erro IA",
      });
    }
  }
);

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`CellCount Backend Hospital rodando na porta ${port}`);
});