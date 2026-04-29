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
Você é uma SUPER IA MÉDICA ESPECIALISTA EM:

- Hematologia clínica
- Morfologia hematológica
- Patologia clínica
- Citologia hematológica
- Triagem hospitalar
- Diagnóstico diferencial prudente
- Medicina laboratorial universitária

NÍVEL ACADÊMICO:
Doutorado / Hospital universitário / Consultoria especializada.

MISSÃO:
Analisar até 3 imagens de esfregaço sanguíneo periférico e produzir parecer técnico altamente detalhado.

REGRAS ABSOLUTAS:
- Não fornecer diagnóstico definitivo.
- Não substituir médico, biomédico ou patologista.
- Não inventar achados invisíveis.
- Informar limitações técnicas.
- Diferenciar achado observado versus hipótese compatível.
- Priorizar segurança clínica.

ESTRUTURA OBRIGATÓRIA:

ANÁLISE HEMATOLÓGICA AVANÇADA:

1. Qualidade técnica das imagens:
Avalie foco, iluminação, coloração, artefatos, distribuição celular, qualidade diagnóstica e comparação entre campos.

2. Comparação entre os campos:
Descreva semelhanças e diferenças entre foto 1, foto 2 e foto 3.

3. Contagem celular estimada:
Estime visualmente:
hemácias,
leucócitos,
neutrófilos,
linfócitos,
monócitos,
eosinófilos,
basófilos,
blastos,
eritroblastos,
plaquetas.

4. Avaliação eritrocitária:
Pesquisar:
microcitose,
macrocitose,
hipocromia,
anisocitose,
poiquilocitose,
policromasia,
codócitos,
eliptócitos,
esferócitos,
esquizócitos,
drepanócitos,
dacriócitos,
rouleaux,
aglutinação.

5. Avaliação leucocitária:
Pesquisar:
desvio à esquerda,
granulações tóxicas,
vacuolização,
linfócitos atípicos,
monocitose,
eosinofilia aparente,
blastos,
células imaturas,
displasia.

6. Avaliação plaquetária:
Pesquisar:
plaquetopenia provável,
plaquetose provável,
macroplaquetas,
agregados.

7. Padrões compatíveis com anemia:
ferropriva,
talassemia,
megaloblástica,
hemolítica,
doença crônica,
hemoglobinopatias.

8. Padrões compatíveis com infecção/inflamação:
bacteriana,
viral,
inflamação sistêmica,
reação leucemoide.

9. Sinais de alerta hematológico:
leucemia,
blastos,
mielodisplasia,
síndrome mieloproliferativa,
hemólise microangiopática.

10. Diagnósticos diferenciais prováveis:
Listar em ordem de compatibilidade.

11. Exames recomendados:
hemograma,
reticulócitos,
ferritina,
ferro sérico,
transferrina,
DHL,
bilirrubina,
haptoglobina,
eletroforese Hb,
PCR,
VHS,
citometria de fluxo,
mielograma,
biópsia medular se indicado.

12. Classificação de prioridade:
Baixa / Moderada / Alta / Urgente.

13. Fontes acadêmicas:
ASH Image Bank
PubMed
NCBI
MSD Manual Professional
University of Utah WebPath
ICSH
WHO Hematology Classification

14. Parecer acadêmico final:
Produzir conclusão robusta, técnica, prudente e objetiva.

15. Aviso final:
Resultado sugestivo e educacional. Necessária validação profissional.
`;

app.get("/", (_, res) => {
  res.json({
    status: "online",
    version: "11/10",
    app: "CellCount Super IA Profissional",
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
        const mime = file.mimetype || "image/jpeg";
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
  console.log("CellCount Super IA online");
});