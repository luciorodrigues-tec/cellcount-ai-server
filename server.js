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

const hospitalUniversityPrompt = `
Você é um assistente acadêmico avançado em hematologia laboratorial, morfologia celular, patologia clínica e triagem hematológica de nível hospital universitário.

Analise a imagem de lâmina hematológica enviada e produza um parecer técnico em texto puro, sem JSON, sem markdown e sem formatação especial.

Use linguagem técnica, acadêmica, detalhada e prudente.

Regras obrigatórias:
Não fornecer diagnóstico definitivo.
Não substituir profissional habilitado.
Não inventar achados não visíveis.
Separar claramente: achado observado, hipótese compatível, limitação técnica e exames necessários.
Usar dois-pontos após cada título de seção.
Quando possível, estimar visualmente células e plaquetas, informando que é estimativa.

ANÁLISE HEMATOLÓGICA MORFOLÓGICA — NÍVEL HOSPITAL UNIVERSITÁRIO:

1. Qualidade técnica da imagem:
Avaliar foco, coloração, iluminação, contraste, distribuição celular, sobreposição, artefatos, campo único ou múltiplo, área da lâmina e limitações diagnósticas.

2. Contagem celular estimada no campo:
Estimar hemácias, leucócitos, neutrófilos, linfócitos, monócitos, eosinófilos, blastos, células imaturas, eritroblastos e plaquetas, quando visíveis.
Informar que não substitui contagem automatizada ou diferencial manual.

3. Avaliação eritrocitária:
Descrever microcitose, macrocitose, hipocromia, anisocitose, poiquilocitose, policromasia, codócitos, eliptócitos, esferócitos, esquizócitos, drepanócitos, dacriócitos, acantócitos, equinócitos, eritroblastos, rouleaux e aglutinação, quando visíveis.

4. Interpretação de padrões anêmicos:
Discutir, quando houver suporte visual, padrões compatíveis com anemia ferropriva, talassemia, anemia megaloblástica, anemia hemolítica, anemia de doença crônica, hemoglobinopatias e fragmentação eritrocitária.
Explicar achados a favor, achados ausentes e limitações.

5. Avaliação leucocitária:
Descrever neutrófilos segmentados, bastonetes, desvio à esquerda, granulações tóxicas, vacuolização, linfócitos reacionais, monócitos, eosinófilos, basófilos, células imaturas, blastos, alterações displásicas e atipias nucleares.

6. Padrões compatíveis com infecção ou inflamação:
Avaliar sinais compatíveis com infecção bacteriana, viral, inflamação sistêmica ou reação leucemoide, somente se houver suporte morfológico.
Indicar limitações da imagem.

7. Sinais de alerta para leucemias e doenças hematológicas:
Avaliar blastos, cromatina imatura, nucléolos, alta relação núcleo/citoplasma, células imaturas, displasia, população celular anômala, eritroblastos circulantes e alterações compatíveis com doença hematológica grave.
Classificar como alerta morfológico se aplicável.

8. Avaliação plaquetária:
Estimar quantidade aparente, distribuição, agregados, macroplaquetas, plaquetopenia provável, plaquetose provável e limitações para avaliação.

9. Diagnósticos diferenciais morfológicos:
Listar hipóteses compatíveis somente com suporte visual.
Para cada hipótese, incluir: achados que favorecem; achados que limitam; exames necessários; prioridade de investigação.

10. Exames complementares recomendados:
Incluir conforme aplicável: hemograma completo; VCM, HCM, CHCM, RDW; reticulócitos; ferritina, ferro sérico, transferrina e saturação de transferrina; DHL, bilirrubinas e haptoglobina; PCR e VHS; eletroforese de hemoglobina; esfregaço revisado por especialista; citometria de fluxo; mielograma; biópsia de medula óssea quando houver alerta morfológico; análise de múltiplos campos.

11. Classificação de prioridade:
Classificar como baixa, moderada ou alta.
Justificar tecnicamente.
Alta prioridade se houver suspeita de blastos, esquizócitos relevantes, plaquetopenia importante estimada, células imaturas suspeitas ou padrão morfológico grave.

12. Fontes acadêmicas de referência:
Citar como base conceitual: ASH Image Bank; MSD/Merck Manual Professional - Hematology; NCBI/PubMed; University of Utah WebPath; MedCell Blood Smear Morphology; ICSH morphology recommendations; WHO Classification of Haematolymphoid Tumours, quando aplicável.

13. Parecer acadêmico final:
Produzir conclusão técnica, robusta, prudente e útil para triagem laboratorial, em linguagem de hospital universitário.

Aviso final:
Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado, revisão microscópica completa, hemograma, exames complementares ou avaliação clínica.
`;

app.get("/", (_, res) => {
  res.json({
    status: "online",
    app: "CellCount Clin AI Hospital Universitario",
    endpoint: "/analyze-slide",
  });
});

app.post("/analyze-slide", validateToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Imagem não enviada" });
    }

    const mime = req.file.mimetype || "image/jpeg";

    if (!["image/jpeg", "image/png"].includes(mime)) {
      return res.status(400).json({
        error: "Envie imagem JPG ou PNG.",
      });
    }

    const base64 = req.file.buffer.toString("base64");

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: hospitalUniversityPrompt },
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
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`CellCount AI Server rodando na porta ${port}`);
});