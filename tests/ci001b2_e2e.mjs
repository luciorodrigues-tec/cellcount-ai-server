import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const BASE_URL =
  process.env.CELLCOUNT_BASE_URL ||
  "http://localhost:3000";

const API_TOKEN =
  process.env.CELLCOUNT_API_TOKEN ||
  "cellcount_enterprise_2026_secure_ai_v4";

const USER_ID =
  process.env.CELLCOUNT_USER_ID ||
  "ci001b2_e2e_validation";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    "Uso: node tests/ci001b2_e2e.mjs <sangue.jpg> <medula.jpg> [relatorio.json]",
  );
  process.exit(2);
}

const peripheralImage = path.resolve(args[0]);
const marrowImage = path.resolve(args[1]);
const reportPath = path.resolve(
  args[2] || "reports/ci001b2_e2e_report.json",
);

const forbiddenMarrowPhrases = [
  "esfregaço de sangue periférico normal",
  "esfregaço sanguíneo normal",
  "hemácias normocíticas e normocrômicas",
  "plaquetas em quantidade adequada",
  "morfologia periférica preservada",
];

function assertFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} não encontrada: ${filePath}`);
  }

  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) {
    throw new Error(`${label} inválida ou vazia: ${filePath}`);
  }
}

function mimeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  return {
    ".png": "image/png",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
  }[extension] || "application/octet-stream";
}

function headers() {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    "x-user-id": USER_ID,
  };
}

async function readJsonResponse(response) {
  const body = await response.text();

  let decoded;
  try {
    decoded = JSON.parse(body);
  } catch {
    throw new Error(
      `Resposta não JSON (${response.status}): ${body.slice(0, 500)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${
        decoded.error || decoded.detail || body
      }`,
    );
  }

  return decoded;
}

async function classifySpecimen(filePath) {
  const form = new FormData();
  const bytes = fs.readFileSync(filePath);

  form.append(
    "image",
    new Blob([bytes], { type: mimeFor(filePath) }),
    path.basename(filePath),
  );
  form.append("clinicalSafetyMode", "true");
  form.append("classifierVersion", "CI-001B.2-e2e");

  const response = await fetch(
    `${BASE_URL}/classify-specimen`,
    {
      method: "POST",
      headers: headers(),
      body: form,
    },
  );

  const decoded = await readJsonResponse(response);

  const classification =
    decoded.specimenClassification ||
    decoded.classification ||
    decoded;

  if (!classification?.predictedType) {
    throw new Error(
      "Classificador não retornou predictedType.",
    );
  }

  return classification;
}

function buildDecision(classification) {
  const confidence = Number(
    classification.confidence || 0,
  );

  const accepted =
    confidence >= 0.85 &&
    ![
      "INADEQUATE",
      "INDETERMINATE",
    ].includes(classification.predictedType);

  return {
    status: accepted
      ? "accepted"
      : "reviewRequired",
    effectiveType: classification.predictedType,
    classification,
    conflict: {
      severity: "none",
      declaredType: null,
      predictedType: classification.predictedType,
      message: null,
    },
    messages: accepted
      ? []
      : [
          "Classificação abaixo do limiar de alta confiança; revisão obrigatória.",
        ],
  };
}

async function analyzeSlide(
  filePath,
  classification,
) {
  const decision = buildDecision(classification);
  const form = new FormData();
  const bytes = fs.readFileSync(filePath);

  form.append(
    "image",
    new Blob([bytes], { type: mimeFor(filePath) }),
    path.basename(filePath),
  );
  form.append("analysisSource", "ai_visual");
  form.append("manualCounts", "{}");
  form.append("safeClinicalMode", "true");
  form.append(
    "enterprisePipeline",
    "v6_safe_hybrid",
  );
  form.append(
    "clinicalIntelligenceVersion",
    "CI-001B.2-e2e",
  );
  form.append(
    "specimenDecision",
    JSON.stringify(decision),
  );
  form.append(
    "specimenType",
    decision.effectiveType,
  );
  form.append(
    "specimenConfidence",
    String(classification.confidence || 0),
  );
  form.append(
    "specimenDecisionStatus",
    decision.status,
  );

  const response = await fetch(
    `${BASE_URL}/analyze-slide`,
    {
      method: "POST",
      headers: headers(),
      body: form,
    },
  );

  return readJsonResponse(response);
}

function deepText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(deepText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map(deepText)
      .join(" ");
  }

  return String(value);
}

function extractAnalysis(response) {
  return (
    response.analysis ||
    response.result ||
    response
  );
}

function validatePeripheral(
  classification,
  analysis,
) {
  const failures = [];
  const warnings = [];

  if (
    classification.predictedType !==
    "PERIPHERAL_BLOOD"
  ) {
    warnings.push(
      `Esperado PERIPHERAL_BLOOD, recebido ${classification.predictedType}.`,
    );
  }

  const specimenType =
    analysis.specimenType ||
    analysis.specimenDecision?.effectiveType ||
    analysis.specimenRouting?.specimenType;

  if (
    specimenType &&
    specimenType !== "PERIPHERAL_BLOOD"
  ) {
    failures.push(
      `Roteamento periférico divergente: ${specimenType}.`,
    );
  }

  const route =
    analysis.specimenRouting?.analysisType;

  if (route && route !== "peripheral_blood") {
    failures.push(
      `analysisType periférico inválido: ${route}.`,
    );
  }

  return { failures, warnings };
}

function validateMarrow(
  classification,
  analysis,
) {
  const failures = [];
  const warnings = [];

  const allowedMarrowTypes = new Set([
    "BONE_MARROW_ASPIRATE",
    "HEMODILUTED_BONE_MARROW",
    "BONE_MARROW_BIOPSY",
  ]);

  if (
    !allowedMarrowTypes.has(
      classification.predictedType,
    )
  ) {
    warnings.push(
      `Esperado tipo medular, recebido ${classification.predictedType}.`,
    );
  }

  const specimenType =
    analysis.specimenType ||
    analysis.specimenDecision?.effectiveType;

  if (
    specimenType &&
    !allowedMarrowTypes.has(specimenType)
  ) {
    failures.push(
      `Roteamento medular divergente: ${specimenType}.`,
    );
  }

  const route =
    analysis.specimenRouting?.analysisType;

  if (route && route !== "bone_marrow") {
    failures.push(
      `analysisType medular inválido: ${route}.`,
    );
  }

  const text = deepText(analysis).toLowerCase();

  for (const phrase of forbiddenMarrowPhrases) {
    if (text.includes(phrase)) {
      failures.push(
        `Frase periférica proibida no laudo medular: "${phrase}".`,
      );
    }
  }

  const marrowFields = [
    "specimenAssessment",
    "marrowAdequacy",
    "spiculeAssessment",
    "hemodilutionAssessment",
    "cellularityAssessment",
    "myeloidSeries",
    "erythroidSeries",
    "megakaryocyticSeries",
    "plasmaCellAssessment",
    "blastAssessment",
    "dysplasiaAssessment",
    "infiltrationAssessment",
    "marrowLimitations",
  ];

  for (const field of marrowFields) {
    if (
      analysis[field] === undefined ||
      analysis[field] === null
    ) {
      warnings.push(
        `Campo medular ausente: ${field}.`,
      );
    }
  }

  return { failures, warnings };
}

async function runCase({
  name,
  image,
  validator,
}) {
  const startedAt = Date.now();

  console.log(`\n=== ${name} ===`);
  console.log(`Imagem: ${image}`);

  const classification =
    await classifySpecimen(image);

  console.log(
    "Classificação:",
    classification.predictedType,
    `(${Math.round(
      Number(classification.confidence || 0) * 100,
    )}%)`,
  );

  const rawResponse =
    await analyzeSlide(image, classification);

  const analysis =
    extractAnalysis(rawResponse);

  const validation =
    validator(classification, analysis);

  const passed =
    validation.failures.length === 0;

  console.log(
    passed ? "PASSOU" : "FALHOU",
    `em ${Date.now() - startedAt} ms`,
  );

  for (const warning of validation.warnings) {
    console.warn(`AVISO: ${warning}`);
  }

  for (const failure of validation.failures) {
    console.error(`ERRO: ${failure}`);
  }

  return {
    name,
    image,
    passed,
    elapsedMs: Date.now() - startedAt,
    classification,
    specimenRouting:
      analysis.specimenRouting || null,
    specimenType:
      analysis.specimenType || null,
    validation,
    analysis,
  };
}

async function main() {
  assertFile(
    peripheralImage,
    "Imagem de sangue periférico",
  );
  assertFile(
    marrowImage,
    "Imagem de medula óssea",
  );

  const healthResponse = await fetch(
    `${BASE_URL}/health`,
  );

  if (!healthResponse.ok) {
    throw new Error(
      `Backend indisponível em ${BASE_URL}.`,
    );
  }

  const cases = [];

  cases.push(
    await runCase({
      name: "Sangue periférico",
      image: peripheralImage,
      validator: validatePeripheral,
    }),
  );

  cases.push(
    await runCase({
      name: "Medula óssea",
      image: marrowImage,
      validator: validateMarrow,
    }),
  );

  const report = {
    suite: "CI-001B.2 End-to-End Specimen Validation",
    version: "1.0.0",
    executedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    passed: cases.every((item) => item.passed),
    summary: {
      total: cases.length,
      passed: cases.filter((item) => item.passed)
        .length,
      failed: cases.filter((item) => !item.passed)
        .length,
      warnings: cases.reduce(
        (sum, item) =>
          sum + item.validation.warnings.length,
        0,
      ),
    },
    cases,
  };

  fs.mkdirSync(
    path.dirname(reportPath),
    { recursive: true },
  );

  fs.writeFileSync(
    reportPath,
    JSON.stringify(report, null, 2),
    "utf8",
  );

  console.log(`\nRelatório: ${reportPath}`);
  console.log(
    report.passed
      ? "CI-001B.2 APROVADA"
      : "CI-001B.2 REPROVADA",
  );

  process.exit(report.passed ? 0 : 1);
}

main().catch((error) => {
  console.error("\nE2E ERROR:", error);
  process.exit(1);
});
