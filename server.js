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
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

app.use(cors());
app.use(express.json());

function validateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (token !== process.env.API_TOKEN) {
    return res.status(401).json({
      error: "Token inválido",
    });
  }

  next();
}

function cleanJsonText(text) {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

app.get("/", (_, res) => {
  res.json({
    status: "online",
    app: "CellCount Clin AI Medical Elite",
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

      const mime = req.file.mimetype || "image/jpeg";

      if (!["image/jpeg", "image/png"].includes(mime)) {
        return res.status(400).json({
          error: `Formato inválido: ${mime}. Envie JPG ou PNG.`,
        });
      }

      const base64 = req.file.buffer.toString("base64");

      const prompt = `
Você é um assistente acadêmico de apoio em hematologia laboratorial.

OBJETIVO:
Analisar imagem de lâmina hematológica e sugerir achados morfológicos, padrões compatíveis e diagnósticos diferenciais possíveis.

REGRAS DE SEGURANÇA:
- Não dar diagnóstico definitivo.
- Não substituir profissional habilitado.
- Não inventar achados não visíveis.
- Separar achado observado de hipótese compatível.
- Informar limitações técnicas da imagem.
- Usar linguagem acadêmica, objetiva e prudente.
- Recomendar correlação com hemograma, índices hematimétricos, plaquetas, leucograma, dados clínicos e revisão microscópica humana.
- Se a imagem estiver ruim, declarar baixa confiança.
- Retornar SOMENTE JSON válido, sem markdown e sem texto fora do JSON.

FONTES DE REFERÊNCIA A CONSIDERAR:
1. ASH Image Bank
2. MSD/Merck Manual Professional - Hematology
3. NCBI / PubMed
4. University of Utah WebPath
5. MedCell Blood Smear Morphology
6. ICSH morphology recommendations

INVESTIGAR QUANDO VISÍVEL:
- Microcitose
- Macrocitose
- Hipocromia
- Anisocitose
- Poiquilocitose
- Codócitos
- Esquizócitos
- Drepanócitos
- Eliptócitos
- Esferócitos
- Policromasia
- Eritroblastos
- Blastos
- Desvio à esquerda
- Granulações tóxicas
- Vacuolização
- Linfócitos atípicos
- Plaquetopenia
- Plaquetose
- Macroplaquetas
- Agregados plaquetários

CONSIDERAR COMO HIPÓTESES DIFERENCIAIS, QUANDO HOUVER SUPORTE VISUAL:
- Anemia ferropriva
- Talassemias
- Anemias hemolíticas
- Anemia megaloblástica
- Processos infecciosos/inflamatórios
- Hemoglobinopatias
- Leucemias
- Síndromes mieloproliferativas
- Alterações plaquetárias quantitativas ou morfológicas

FORMATO OBRIGATÓRIO:
{
  "title": "Análise morfológica hematológica",
  "academicSummary": "Resumo técnico e acadêmico da imagem.",
  "imageQuality": {
    "quality": "boa | regular | ruim",
    "limitations": ["..."]
  },
  "observedFindings": [
    {
      "finding": "achado observado",
      "category": "hemácias | leucócitos | plaquetas | artefato | outro",
      "severity": "discreto | moderado | acentuado | indeterminado",
      "evidence": "descrição do que foi visto na imagem",
      "confidence": 0
    }
  ],
  "probableCells": [
    {
      "cell": "célula provável",
      "confidence": 0,
      "comment": "comentário técnico curto"
    }
  ],
  "differentialPossibilities": [
    {
      "condition": "possibilidade compatível",
      "supportingFindings": ["achados que sustentam"],
      "limitations": ["limitações para confirmar"],
      "priority": "baixa | moderada | alta"
    }
  ],
  "recommendedCorrelation": [
    "Hemograma completo",
    "VCM, HCM, CHCM, RDW",
    "Contagem de reticulócitos quando indicado",
    "Ferro sérico, ferritina e transferrina quando indicado",
    "Revisão microscópica por profissional habilitado"
  ],
  "priority": {
    "level": "baixa | moderada | alta",
    "reason": "motivo da prioridade"
  },
  "references": [
    {
      "name": "ASH Image Bank",
      "use": "comparação morfológica educacional"
    },
    {
      "name": "MSD/Merck Manual Professional - Hematology",
      "use": "correlação clínica e laboratorial"
    },
    {
      "name": "NCBI/PubMed",
      "use": "literatura biomédica"
    },
    {
      "name": "University of Utah WebPath",
      "use": "morfologia e patologia educacional"
    },
    {
      "name": "MedCell Blood Smear Morphology",
      "use": "referência visual de esfregaço sanguíneo"
    },
    {
      "name": "ICSH morphology recommendations",
      "use": "padronização morfológica"
    }
  ],
  "confidence": 0,
  "warning": "Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado."
}
`;

      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4o",
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

      const text = cleanJsonText(response.output_text || "");
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