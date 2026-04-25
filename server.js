import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

app.use(cors());
app.use(express.json());

function validateToken(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (!process.env.API_TOKEN || token !== process.env.API_TOKEN) {
    return res.status(401).json({
      error: "Token inválido ou ausente"
    });
  }

  next();
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    app: "CellCount Clin AI V13"
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
          error: "Imagem não enviada"
        });
      }

      return res.json({
        title: "Análise comparativa hematológica",
        interpretation:
          "Imagem recebida pelo servidor seguro. Para interpretação real, conecte este backend a um modelo treinado/API multimodal.",
        confidence: 0,
        sources: [
          "ASH Image Bank",
          "University of Utah WebPath",
          "Medcell Blood Smear Morphology"
        ],
        cellSuggestions: [],
        morphologySuggestions: [],
        warning:
          "IA ainda não conectada a modelo real. Resultado não deve ser usado como diagnóstico."
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message
      });
    }
  }
);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`CellCount AI Server rodando na porta ${port}`);
});