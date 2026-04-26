import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json());

function validateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({ error: "Token inválido" });
  }

  next();
}

app.get("/", (_, res) => {
  res.json({ status: "online", app: "CellCount Clin AI V13" });
});

app.post("/analyze-slide", validateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Imagem não enviada" });
    }

    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype || "image/jpeg";

    const response = await openai.responses.create({
      model: "gpt-5.4",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Você é um assistente de apoio educacional em hematologia.

Analise a imagem de lâmina hematológica enviada.
NÃO dê diagnóstico definitivo.
Retorne somente JSON válido.

Compare conceitualmente com referências educacionais confiáveis:
1. ASH Image Bank
2. University of Utah WebPath
3. Medcell Blood Smear Morphology

Formato obrigatório:
{
  "title": "...",
  "interpretation": "...",
  "confidence": 0-100,
  "sources": ["ASH Image Bank", "University of Utah WebPath", "Medcell Blood Smear Morphology"],
  "cellSuggestions": ["..."],
  "morphologySuggestions": ["..."],
  "warning": "Resultado sugestivo. Validar por profissional habilitado."
}
`
            },
            {
              type: "input_image",
              image_url: `data:${mime};base64,${base64}`
            }
          ]
        }
      ]
    });

    const text = response.output_text.trim();
    const json = JSON.parse(text);

    return res.json(json);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Erro na IA"
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`CellCount AI Server rodando na porta ${port}`);
});