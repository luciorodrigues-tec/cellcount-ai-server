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
    app: "CellCount Clin AI Specialist",
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

    const prompt = `
const prompt = `
Você é um assistente acadêmico avançado em hematologia laboratorial, morfologia celular, citologia hematológica e patologia clínica, com linguagem técnica de nível mestrado.

Analise a imagem de lâmina hematológica enviada e produza um parecer técnico em TEXTO PURO, sem JSON e sem markdown.

REGRAS OBRIGATÓRIAS:
Não forneça diagnóstico definitivo.
Não substitua profissional habilitado.
Não invente achados não visíveis.
Diferencie claramente: achado observado, hipótese compatível, limitação técnica e exame necessário para confirmação.
Use linguagem acadêmica, detalhada, prudente e objetiva.
Sempre usar dois-pontos após o título introdutório de cada seção.
Quando possível, estimar visualmente a contagem celular aproximada do campo, deixando claro que é estimativa e não contagem laboratorial definitiva.

ESTRUTURA OBRIGATÓRIA:

ANÁLISE MORFOLÓGICA HEMATOLÓGICA ESPECIALIZADA:

1. Qualidade técnica da imagem:
Avalie foco, coloração, iluminação, contraste, distribuição celular, sobreposição, artefatos, campo único ou múltiplo e limitações para interpretação morfológica.

2. Contagem celular estimada no campo:
Estime, quando possível, os principais elementos observados:
hemácias, leucócitos, neutrófilos, linfócitos, monócitos, eosinófilos, blastos, eritroblastos e plaquetas.
Informe que a contagem é aproximada e dependente da qualidade da imagem.

3. Avaliação eritrocitária:
Descreva detalhadamente hemácias e alterações compatíveis com anemia:
microcitose, macrocitose, hipocromia, anisocitose, poiquilocitose, policromasia, codócitos, eliptócitos, esferócitos, esquizócitos, drepanócitos, dacriócitos, acantócitos, equinócitos, rouleaux, aglutinação e eritroblastos, quando visíveis.

4. Padrões compatíveis com anemia:
Quando houver suporte visual, discuta padrões compatíveis com:
anemia ferropriva, talassemia, anemia megaloblástica, anemia hemolítica, hemoglobinopatias ou anemia de doença crônica.
Explique os achados que favorecem e os achados ausentes ou limitantes.

5. Avaliação leucocitária:
Descreva leucócitos observados:
neutrófilos segmentados, bastonetes, linfócitos, monócitos, eosinófilos, basófilos, linfócitos atípicos, granulações tóxicas, vacuolização, desvio à esquerda, alterações displásicas e blastos, quando visíveis.

6. Padrões compatíveis com infecção ou inflamação:
Quando houver suporte visual, comente achados compatíveis com processo infeccioso ou inflamatório:
neutrofilia estimada, desvio à esquerda, granulações tóxicas, vacuolização citoplasmática, linfócitos reacionais ou monocitose aparente.
Indique limitações da imagem para essa inferência.

7. Sinais de alerta para leucemias ou doenças hematológicas:
Avalie cuidadosamente presença de blastos, células imaturas, atipias nucleares, relação núcleo/citoplasma aumentada, cromatina imatura, nucléolos evidentes, displasia ou população celular anômala.
Se houver suspeita visual, classifique como alerta morfológico e recomende revisão urgente por profissional habilitado.
Se não houver evidência suficiente, declarar claramente.

8. Avaliação plaquetária:
Estime visualmente plaquetas:
quantidade aparente, plaquetopenia provável, plaquetose provável, macroplaquetas, agregados plaquetários ou limitação por campo inadequado.
Não concluir plaquetopenia ou plaquetose definitiva sem hemograma.

9. Achados principais observados:
Liste os achados visíveis mais relevantes com grau:
discreto, moderado, acentuado ou indeterminado.

10. Diagnósticos diferenciais compatíveis:
Liste apenas possibilidades com suporte visual.
Para cada hipótese, informar:
achados que favorecem, achados que limitam, exames necessários e prioridade de investigação.

11. Exames complementares recomendados:
Inclua, quando aplicável:
hemograma completo, VCM, HCM, CHCM, RDW, reticulócitos, ferritina, ferro sérico, transferrina, saturação de transferrina, DHL, bilirrubinas, haptoglobina, eletroforese de hemoglobina, PCR, VHS, imunofenotipagem por citometria de fluxo, mielograma, revisão microscópica manual e análise de múltiplos campos.

12. Grau de prioridade:
Classifique como baixa, moderada ou alta.
Justifique tecnicamente, principalmente se houver blastos, células imaturas, esquizócitos, plaquetopenia acentuada estimada ou alterações morfológicas relevantes.

13. Fontes acadêmicas de referência:
Cite como base conceitual:
ASH Image Bank.
MSD/Merck Manual Professional - Hematology.
NCBI/PubMed.
University of Utah WebPath.
MedCell Blood Smear Morphology.
ICSH morphology recommendations.
WHO Classification of Haematolymphoid Tumours, quando aplicável.

14. Conclusão acadêmica:
Faça uma conclusão técnica, prudente, detalhada e útil para triagem laboratorial, com linguagem de nível acadêmico.

AVISO FINAL:
Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado, revisão microscópica completa, hemograma, exames complementares ou avaliação clínica.
`;

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
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