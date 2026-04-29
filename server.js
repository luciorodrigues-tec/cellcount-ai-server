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
    fileSize: 10 * 1024 * 1024,
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

Contexto permitido:
A análise é de apoio educacional e laboratorial, voltada à descrição morfológica de lâmina hematológica. Você pode descrever células, morfologia, qualidade técnica, padrões compatíveis, hipóteses diferenciais prudentes, fontes acadêmicas e exames de correlação.

Estrutura obrigatória:

ANÁLISE MORFOLÓGICA HEMATOLÓGICA AVANÇADA:

1. Qualidade técnica das imagens:
Descreva foco, iluminação, coloração, contraste, distribuição celular, sobreposição, artefatos e limitações. Se houver mais de uma imagem, compare os campos.

2. Comparação entre os campos:
Descreva se os campos são semelhantes ou diferentes. Se apenas uma imagem foi enviada, informe que a avaliação está limitada a campo único.

3. Contagem celular estimada:
Estime visualmente, quando possível, hemácias, leucócitos, neutrófilos, linfócitos, monócitos, eosinófilos, basófilos, células imaturas, blastos, eritroblastos e plaquetas. Deixe claro que é estimativa visual e não substitui contagem laboratorial.

4. Avaliação eritrocitária:
Descreva microcitose, macrocitose, hipocromia, anisocitose, poiquilocitose, policromasia, codócitos, eliptócitos, esferócitos, esquizócitos, drepanócitos, dacriócitos, acantócitos, equinócitos, rouleaux, aglutinação e eritroblastos, apenas quando visíveis.

5. Padrões compatíveis com anemia:
Quando houver suporte visual, discuta de forma prudente padrões compatíveis com anemia ferropriva, talassemia, anemia megaloblástica, anemia hemolítica, anemia de doença crônica, hemoglobinopatias ou fragmentação eritrocitária. Explique achados a favor e limitações.

6. Avaliação leucocitária:
Descreva neutrófilos segmentados, bastonetes, desvio à esquerda, granulações tóxicas, vacuolização, linfócitos reacionais, monócitos, eosinófilos, basófilos, células imaturas, blastos, alterações displásicas e atipias nucleares, apenas quando visíveis.

7. Padrões compatíveis com infecção ou inflamação:
Quando houver suporte visual, comente sinais compatíveis com resposta inflamatória, processo bacteriano, viral ou reacional. Indique as limitações da imagem.

8. Sinais de alerta hematológico:
Avalie presença ou ausência de blastos evidentes, células imaturas suspeitas, displasia evidente, esquizócitos relevantes, eritroblastos circulantes ou padrão que mereça revisão urgente. Use linguagem prudente.

9. Avaliação plaquetária:
Estime quantidade aparente, distribuição, agregados, macroplaquetas, plaquetopenia provável ou plaquetose provável, sempre como estimativa visual.

10. Diagnósticos diferenciais morfológicos:
Liste possibilidades compatíveis somente quando houver suporte visual. Para cada possibilidade, descreva achados que favorecem, achados que limitam e exames necessários.

11. Exames complementares recomendados:
Inclua quando aplicável: hemograma completo, VCM, HCM, CHCM, RDW, reticulócitos, ferritina, ferro sérico, transferrina, saturação de transferrina, DHL, bilirrubinas, haptoglobina, PCR, VHS, eletroforese de hemoglobina, revisão microscópica manual, citometria de fluxo, mielograma ou análise de múltiplos campos.

12. Classificação de prioridade:
Classifique como baixa, moderada, alta ou urgente, justificando tecnicamente.

13. Fontes acadêmicas de referência:
Cite como base conceitual: ASH Image Bank; MSD/Merck Manual Professional - Hematology; NCBI/PubMed; University of Utah WebPath; MedCell Blood Smear Morphology; ICSH morphology recommendations; WHO Classification of Haematolymphoid Tumours, quando aplicável.

14. Parecer acadêmico final:
Faça uma conclusão técnica, clara, prudente e útil para triagem laboratorial.

Aviso final:
Resultado sugestivo, educacional e de apoio. Não substitui validação por profissional habilitado, revisão microscópica completa, hemograma, exames complementares ou avaliação clínica.
`;

app.get("/", (_, res) => {
  res.json({
    status: "online",
    app: "CellCount Super IA Profissional",
    version: "11-10-safe",
  });
});

app.post(
  "/analyze-slide",
  validateToken,
  upload.any(),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: "Nenhuma imagem enviada",
        });
      }

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

      return res.json({
        result: response.output_text.trim(),
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        error: error.message || "Erro IA",
      });
    }
  }
);

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log("CellCount Super IA Profissional online");
});