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
    return res.status(401).json({
      error: "Token inválido",
    });
  }

  next();
}

app.get("/", (_, res) => {
  res.json({
    status: "online",
    app: "CellCount Clin AI Specialist",
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
          error: "Envie imagem JPG ou PNG.",
        });
      }

      const base64 = req.file.buffer.toString("base64");

      const prompt = `
const prompt = `
Você é um assistente acadêmico avançado com perfil de patologista clínico, hematologista laboratorial e especialista em morfologia celular.

Analise a imagem de lâmina hematológica enviada com nível técnico elevado.

RETORNE APENAS TEXTO PURO.
Não retorne JSON.
Não use markdown.
Não use diagnóstico definitivo.
Não invente achados não visíveis.
Diferencie claramente achado observado, hipótese compatível e limitação técnica.

Estrutura obrigatória:

ANÁLISE MORFOLÓGICA HEMATOLÓGICA ESPECIALIZADA

1. Qualidade técnica da imagem
Avalie foco, coloração, iluminação, contraste, distribuição celular, sobreposição, artefatos, campo único ou múltiplo e limitações diagnósticas.

2. Avaliação eritrocitária
Descreva detalhadamente:
anisocitose, poiquilocitose, microcitose, macrocitose, hipocromia, policromasia, codócitos, eliptócitos, esferócitos, esquizócitos, drepanócitos, dacriócitos, acantócitos, equinócitos, eritroblastos, rouleaux ou aglutinação, quando visíveis.

3. Avaliação leucocitária
Descreva as células nucleadas visíveis:
neutrófilos segmentados, bastonetes, linfócitos, monócitos, eosinófilos, basófilos, blastos, linfócitos atípicos, granulações tóxicas, vacuolização, desvio à esquerda ou alterações displásicas, quando visíveis.

4. Avaliação plaquetária
Comente estimativa visual, agregados, macroplaquetas, plaquetopenia provável, plaquetose provável ou limitação para avaliação.

5. Achados principais observados
Liste os achados visíveis mais relevantes, com grau estimado:
discreto, moderado, acentuado ou indeterminado.

6. Interpretação morfológica especializada
Explique o significado laboratorial dos achados, correlacionando com padrões morfológicos conhecidos.

7. Diagnósticos diferenciais compatíveis
Liste possibilidades SOMENTE se houver suporte visual.
Para cada uma, explique:
achados que favorecem
achados ausentes ou limitantes
exames necessários para confirmação

8. Exames complementares recomendados
Inclua, quando aplicável:
hemograma completo
VCM, HCM, CHCM, RDW
reticulócitos
ferritina, ferro sérico, transferrina e saturação
DHL, bilirrubinas e haptoglobina
eletroforese de hemoglobina
PCR/VHS
revisão microscópica manual
análise de múltiplos campos

9. Grau de prioridade
Classifique como baixa, moderada ou alta e justifique.

10. Fontes acadêmicas de referência
Cite fontes usadas como base conceitual:
ASH Image Bank
MSD/Merck Manual Professional - Hematology
NCBI/PubMed
University of Utah WebPath
MedCell Blood Smear Morphology
ICSH morphology recommendations
WHO Classification of Haematolymphoid Tumours, quando aplicável

11. Conclusão acadêmica
Faça uma conclusão técnica, prudente, clara e útil para triagem laboratorial.

AVISO FINAL:
Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado, revisão microscópica completa, hemograma ou avaliação clínica.
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

      return res.json({
        result: response.output_text.trim(),
      });
    } catch (error) {
      console.error(error);

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