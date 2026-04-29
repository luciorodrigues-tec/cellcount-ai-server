import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
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
  res.json({
    status: "online",
    app: "CellCount Clin AI Medical",
    endpoint: "/analyze-slide",
  });
});

app.post(
  "/analyze-slide",
  validateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Imagem não enviada",
        });
      }

      const base64 = req.file.buffer.toString("base64");
      const mime = req.file.mimetype || "image/jpeg";

      if (!["image/jpeg", "image/png"].includes(mime)) {
        return res.status(400).json({
          error: `Formato inválido: ${mime}. Envie JPG ou PNG.`,
        });
      }

      const prompt = `
Você é um assistente de APOIO EDUCACIONAL E LABORATORIAL em hematologia.
Analise a imagem de lâmina hematológica enviada.

REGRAS DE SEGURANÇA:
- Não dê diagnóstico definitivo.
- Não substitua profissional habilitado.
- Use linguagem técnica, objetiva e prudente.
- Se a imagem estiver ruim, informe limitação.
- Sempre recomende correlação com hemograma, dados clínicos e revisão microscópica humana.

Retorne SOMENTE JSON válido, sem markdown, sem texto fora do JSON.

Estrutura obrigatória:
{
  "title": "Análise morfológica hematológica",
  "imageQuality": {
    "quality": "boa | regular | ruim",
    "limitations": ["..."]
  },
  "probableCells": [
    {
      "cell": "nome provável da célula",
      "confidence": 0,
      "comment": "comentário curto"
    }
  ],
  "morphologicalFindings": [
    {
      "finding": "achado morfológico",
      "severity": "discreto | moderado | acentuado | indeterminado",
      "comment": "comentário curto"
    }
  ],
  "compatiblePatterns": [
    "Achados compatíveis com ...",
    "Sugere correlacionar com ..."
  ],
  "priority": {
    "level": "baixa | moderada | alta",
    "reason": "motivo da prioridade"
  },
  "recommendedConduct": [
    "Revisar lâmina por profissional habilitado",
    "Correlacionar com hemograma completo"
  ],
  "confidence": 0,
  "sources": [
    "ASH Image Bank",
    "University of Utah WebPath",
    "Medcell Blood Smear Morphology"
  ],
  "warning": "Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado."
}
`;

      const response = await openai.responses.create({
        model: "gpt-5.4",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              {
                type: "input_image",
                image_url: `data:${mime};base64,${base64}`,
              },
            ],
          },
        ],
      });

      let text = response.output_text.trim();

      text = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      const json = JSON.parse(text);

      return res.json(json);
    } catch (error) {
      console.error("Erro IA:", error);

      return res.status(500).json({
        error: error.message || "Erro na IA",
      });
    }
  }
);

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`CellCount AI Server rodando na porta ${port}`);
});