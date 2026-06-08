// ============================================================================
// CELLCOUNT ENTERPRISE
// ERYTHROCYTE ENGINE V5 ENTERPRISE CALIBRATED
// NEGATION-AWARE RBC MORPHOLOGY INTERPRETER
// ============================================================================

console.log(
  "🔥 RBC ENGINE V5 LOADED",
);

// ============================================================================

export function analyzeErythrocytes(
  analysisText = "",
) {
  const text =
    normalizeText(
      analysisText,
    );

  const findings = [];
  const alerts = [];
  const correlations = [];
  const reasoning = [];
  const contradictionFlags = [];

  const scores = {
    schistocyte: 0,
    acanthocyte: 0,
    echinocyte: 0,
    targetCell: 0,
    sickleCell: 0,
    rouleaux: 0,
    anisocytosis: 0,
    poikilocytosis: 0,
    polychromasia: 0,
    membraneDisorder: 0,
    hemolyticPattern: 0,
    regenerativePattern: 0,
    artifactPattern: 0,
    coherenceScore: 0,
  };

  const normalRbcPattern =
    containsAny(
      text,
      [
        "erythrocytes appear normal",
        "erythrocytes normal",
        "hemacias normais",
        "hemacias sem alteracoes",
        "sem alteracoes eritrocitarias",
        "sem alterações eritrocitárias",
        "normal erythrocyte morphology",
        "normal morphology of erythrocytes",
        "no significant morphological abnormalities",
      ],
    );

  const keywords = {
    schistocyte: [
      "schistocyte",
      "schistocytes",
      "esquizocito",
      "esquizocitos",
      "helmet cell",
      "helmet cells",
      "fragmented erythrocyte",
      "fragmented red cell",
      "fragmented red cells",
      "fragmentacao eritrocitaria",
      "fragmentacao",
      "fragmentacao hemacia",
      "microangiopathic",
      "microangiopatia",
    ],

    acanthocyte: [
      "acanthocyte",
      "acanthocytes",
      "acantocito",
      "acantocitos",
      "spur cell",
      "spur cells",
      "irregular spicules",
      "espiculas irregulares",
      "espiculadas irregulares",
      "membrane projections",
      "projecoes irregulares",
      "spiculated erythrocyte",
      "hemacia espiculada",
    ],

    echinocyte: [
      "echinocyte",
      "echinocytes",
      "equinocito",
      "equinocitos",
      "burr cell",
      "burr cells",
      "regular spicules",
      "espiculas regulares",
    ],

    targetCell: [
      "target cell",
      "target cells",
      "codocito",
      "codocitos",
      "bullseye erythrocyte",
      "bullseye appearance",
      "hemacia em alvo",
      "celula alvo",
    ],

    sickleCell: [
      "sickle cell",
      "sickle cells",
      "drepanocito",
      "drepanocitos",
      "falciforme",
      "hemacia falciforme",
      "sickled erythrocyte",
      "crescent erythrocyte",
    ],

    rouleaux: [
      "rouleaux",
      "stacked erythrocytes",
      "empilhamento eritrocitario",
      "pilha de moedas",
      "coin stacking",
    ],

    anisocytosis: [
      "anisocytosis",
      "anisocitose",
      "size variation",
      "variacao de tamanho",
      "macrocytosis",
      "microcytosis",
      "macrocitose",
      "microcitose",
    ],

    poikilocytosis: [
      "poikilocytosis",
      "poiquilocitose",
      "shape variation",
      "variacao de forma",
      "irregular erythrocytes",
      "hemacias irregulares",
    ],

    polychromasia: [
      "polychromasia",
      "policromasia",
      "reticulocyte response",
      "resposta regenerativa",
      "bluish erythrocytes",
      "hemacias azuladas",
    ],
  };

  for (const [
    morphology,
    terms,
  ] of Object.entries(keywords)) {
    const hits =
      countMatches(
        text,
        terms,
      );

    if (morphology === "schistocyte") {
      if (
        hits >= 2 &&
        !normalRbcPattern
      ) {
        scores.schistocyte += hits * 4;
        scores.hemolyticPattern += hits * 3;
        scores.coherenceScore += hits * 2;

        findings.push({
          type: "schistocyte",
          detected: true,
          severity:
            hits >= 4
              ? "high"
              : "moderate",
        });

        reasoning.push(
          "Fragmentação eritrocitária consistente identificada.",
        );

        correlations.push(
          "Microangiopathic hemolysis",
          "TTP",
          "HUS",
          "DIC",
        );
      }

      continue;
    }

    if (morphology === "acanthocyte") {
      if (
        hits >= 2 &&
        !normalRbcPattern
      ) {
        scores.acanthocyte += hits * 5;
        scores.membraneDisorder += hits * 4;
        scores.coherenceScore += hits * 2;

        findings.push({
          type: "acanthocyte",
          detected: true,
          severity:
            hits >= 3
              ? "high"
              : "moderate",
        });

        reasoning.push(
          "Espículas irregulares compatíveis com acantócitos.",
        );

        correlations.push(
          "Liver disease",
          "Abetalipoproteinemia",
          "Membrane disorder",
        );
      }

      continue;
    }

    if (morphology === "targetCell") {
      if (
        hits >= 1 &&
        !normalRbcPattern
      ) {
        scores.targetCell += hits * 4;
        scores.coherenceScore += hits * 2;

        findings.push({
          type: "target_cell",
          detected: true,
          severity: "moderate",
        });

        reasoning.push(
          "Hemácias em alvo identificadas.",
        );

        correlations.push(
          "Hemoglobinopathy",
          "Liver disease",
          "Thalassemia",
        );
      }

      continue;
    }

    if (morphology === "sickleCell") {
      if (
        hits >= 1 &&
        !normalRbcPattern
      ) {
        scores.sickleCell += hits * 6;
        scores.coherenceScore += hits * 3;

        findings.push({
          type: "sickle_cell",
          detected: true,
          severity: "high",
        });

        alerts.push(
          "Possível padrão drepanocítico morfológico; revisão humana recomendada.",
        );

        reasoning.push(
          "Drepanócitos identificados.",
        );

        correlations.push(
          "Sickle cell disease",
        );
      }

      continue;
    }

    if (morphology === "echinocyte") {
      if (
        hits >= 2 &&
        !normalRbcPattern
      ) {
        scores.echinocyte += hits * 3;
        scores.coherenceScore += hits;

        findings.push({
          type: "echinocyte",
          detected: true,
          severity: "low",
        });

        reasoning.push(
          "Espículas regulares compatíveis com equinócitos.",
        );

        correlations.push(
          "Artifact",
          "Uremia",
        );
      }

      continue;
    }

    if (morphology === "rouleaux") {
      if (
        hits >= 1 &&
        !normalRbcPattern
      ) {
        scores.rouleaux += hits * 4;
        scores.coherenceScore += hits * 2;

        findings.push({
          type: "rouleaux",
          detected: true,
          severity: "moderate",
        });

        reasoning.push(
          "Empilhamento eritrocitário compatível com rouleaux.",
        );

        correlations.push(
          "Inflammation",
          "Myeloma",
          "Hypergammaglobulinemia",
        );
      }

      continue;
    }

    if (morphology === "anisocytosis") {
      if (
        hits >= 2 &&
        !normalRbcPattern
      ) {
        scores.anisocytosis += hits * 2;
        scores.coherenceScore += hits;

        findings.push({
          type: "anisocytosis",
          detected: true,
          severity:
            hits >= 3
              ? "moderate"
              : "low",
        });

        reasoning.push(
          "Variabilidade de tamanho eritrocitário identificada.",
        );
      }

      continue;
    }

    if (morphology === "poikilocytosis") {
      if (
        hits >= 2 &&
        !normalRbcPattern
      ) {
        scores.poikilocytosis += hits * 2;
        scores.coherenceScore += hits;

        findings.push({
          type: "poikilocytosis",
          detected: true,
          severity:
            hits >= 3
              ? "moderate"
              : "low",
        });

        reasoning.push(
          "Variabilidade morfológica eritrocitária identificada.",
        );
      }

      continue;
    }

    if (morphology === "polychromasia") {
      if (
        hits >= 1 &&
        !normalRbcPattern
      ) {
        scores.polychromasia += hits * 2;
        scores.regenerativePattern += hits * 3;

        findings.push({
          type: "polychromasia",
          detected: true,
          severity: "low",
        });

        reasoning.push(
          "Policromasia sugestiva de resposta regenerativa.",
        );

        correlations.push(
          "Hemolysis",
          "Reticulocytosis",
        );
      }

      continue;
    }
  }

  const artifactTerms = [
    "artifact",
    "artefato",
    "crenation",
    "smear artifact",
    "drying artifact",
    "compressao",
    "distortion",
  ];

  const artifactHits =
    countMatches(
      text,
      artifactTerms,
    );

  if (artifactHits >= 2) {
    scores.artifactPattern += artifactHits * 4;

    reasoning.push(
      "Possíveis artefatos microscópicos identificados.",
    );

    if (scores.schistocyte > 0) {
      contradictionFlags.push(
        "Fragmentação eritrocitária pode estar parcialmente relacionada a artefatos.",
      );

      scores.schistocyte =
        Math.max(
          0,
          scores.schistocyte - 4,
        );
    }
  }

  if (
    scores.schistocyte > 0 &&
    scores.acanthocyte > scores.schistocyte
  ) {
    contradictionFlags.push(
      "Predomínio de acantócitos reduz especificidade para esquizócitos.",
    );

    scores.schistocyte =
      Math.max(
        0,
        scores.schistocyte - 3,
      );
  }

  if (
    normalRbcPattern &&
    findings.length === 0
  ) {
    suppressFalsePositiveRbcPattern({
      scores,
      findings,
      alerts,
      correlations,
      reasoning,
      contradictionFlags,
    });
  }

  const dominantMorphology =
    detectDominantMorphology(
      scores,
    );

  const morphologicRisk =
    classifyRisk(
      scores,
    );

  const erythrocyteSummary =
    buildSummary(
      findings,
      dominantMorphology,
      normalRbcPattern,
    );

  return {
    erythrocyteFindings:
      findings,

    erythrocyteAlerts:
      unique(alerts),

    erythrocyteCorrelations:
      unique(correlations),

    erythrocyteReasoning:
      unique(reasoning),

    contradictionFlags:
      unique(
        contradictionFlags,
      ),

    erythrocyteSummary,

    dominantMorphology,

    morphologyScores:
      scores,

    morphologicRisk,
  };
}

// ============================================================================
// FALSE POSITIVE SUPPRESSION
// ============================================================================

function suppressFalsePositiveRbcPattern({
  scores,
  findings,
  alerts,
  correlations,
  reasoning,
  contradictionFlags,
}) {

  const trulyNormal =
    findings.length === 0;

  if (!trulyNormal) {
    return;
  }

  for (const key of Object.keys(scores)) {
    scores[key] = 0;
  }

  reasoning.push(
    "Padrão eritrocitário descrito como normal."
  );
}

// ============================================================================
// DOMINANT MORPHOLOGY
// ============================================================================

function detectDominantMorphology(
  scores = {},
) {
  const relevant = {
    schistocyte:
      scores.schistocyte,

    acanthocyte:
      scores.acanthocyte,

    echinocyte:
      scores.echinocyte,

    targetCell:
      scores.targetCell,

    sickleCell:
      scores.sickleCell,

    rouleaux:
      scores.rouleaux,

    anisocytosis:
      scores.anisocytosis,

    poikilocytosis:
      scores.poikilocytosis,
  };

  const sorted =
    Object.entries(relevant)
      .sort((a, b) => b[1] - a[1]);

  if (sorted[0]?.[1] <= 0) {
    return "normal_pattern";
  }

  return sorted[0][0];
}

// ============================================================================
// RISK
// ============================================================================

function classifyRisk(
  scores = {},
) {
  if (
    scores.schistocyte >= 12 ||
    scores.sickleCell >= 8
  ) {
    return "critical";
  }

  if (
    scores.acanthocyte >= 8 ||
    scores.targetCell >= 6 ||
    scores.hemolyticPattern >= 8
  ) {
    return "high";
  }

  if (
    scores.anisocytosis >= 5 ||
    scores.poikilocytosis >= 5 ||
    scores.polychromasia >= 4
  ) {
    return "moderate";
  }

  return "low";
}

// ============================================================================
// SUMMARY
// ============================================================================

function buildSummary(
  findings = [],
  dominantMorphology = "",
  normalRbcPattern = false,
) {
  if (
    normalRbcPattern ||
    findings.length === 0
  ) {
    return (
      "Sem alterações eritrocitárias significativas."
    );
  }

  const readable =
    dominantMorphology
      .replaceAll(
        "_",
        " ",
      );

  return `Predomínio de ${readable}.`;
}

// ============================================================================
// NEGATION-AWARE COUNT MATCHES
// ============================================================================

function countMatches(
  text,
  keywords = [],
) {
  let count = 0;

  for (const keyword of keywords) {
    const normalizedKeyword =
      normalizeText(keyword);

    let index =
      text.indexOf(
        normalizedKeyword,
      );

    while (index !== -1) {
      const context =
        text.slice(
          Math.max(0, index - 55),
          index +
            normalizedKeyword.length +
            55,
        );

      const negated =
        isNegatedContext(context);

      if (!negated) {
        count++;
      }

      index =
        text.indexOf(
          normalizedKeyword,
          index + 1,
        );
    }
  }

  return count;
}

// ============================================================================
// NEGATION CONTEXT
// ============================================================================

function isNegatedContext(
  context = "",
) {
  const normalized =
    normalizeText(context);

  const negativePatterns = [
    "not observed",
    "not detected",
    "none observed",
    "absent",
    "without evidence",
    "no evidence",
    "no significant",
    "nao observado",
    "nao observados",
    "nao observada",
    "nao observadas",
    "não observado",
    "não observados",
    "não observada",
    "não observadas",
    "ausente",
    "sem evidencia",
    "sem evidência",
    "sem sinais",
    "sem alteracoes",
    "sem alterações",
  ];

  return negativePatterns.some((pattern) =>
    normalized.includes(
      normalizeText(pattern),
    ),
  );
}

// ============================================================================
// CONTAINS ANY
// ============================================================================

function containsAny(
  text,
  keywords = [],
) {
  return keywords.some((keyword) =>
    text.includes(
      normalizeText(keyword),
    ),
  );
}

// ============================================================================
// NORMALIZE TEXT
// ============================================================================

function normalizeText(
  text = "",
) {
  return String(text)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();
}

// ============================================================================
// UNIQUE
// ============================================================================

function unique(
  arr = [],
) {
  return [...new Set(arr)];
}