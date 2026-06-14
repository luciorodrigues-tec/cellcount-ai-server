// ============================================================================
// CELLCOUNT AI
// PLATELET ENGINE V2 ENTERPRISE
// HEMATOLOGY SPECIALIST MODULE
// ============================================================================

import {
  PLATELET_MORPHOLOGY,
} from "./morphologyKnowledgeBase.js";

// ============================================================================

export function analyzePlatelets(
  analysisText = "",
) {

  const text =
    analysisText.toLowerCase();

  const findings = [];

  const alerts = [];

  const correlations = [];

  const reasoning = [];

  const contradictionFlags = [];

  // ==========================================================================
  // SCORES
  // ==========================================================================

  const scores = {

    giantPlatelets: 0,

    plateletAggregation: 0,

    thrombocytopenia: 0,

    consumptivePattern: 0,

    pseudothrombocytopenia: 0,

    artifactPattern: 0,

    coherenceScore: 0,
  };

  // ==========================================================================
  // GIANT PLATELETS
  // ==========================================================================

  const giantPlateletFeatures = [

    "giant platelets",
    "macroplatelets",
    "large platelets",
    "plaquetas gigantes",
    "macroplaquetas",
    "plaquetas aumentadas",
  ];

  const giantHits =
    countMatches(
      text,
      giantPlateletFeatures,
    );

  if (giantHits >= 2) {

    scores.giantPlatelets +=
      giantHits * 2;

    scores.coherenceScore += 3;

    findings.push({

      type: "giant_platelets",

      detected: true,

      severity:
        PLATELET_MORPHOLOGY
          .giantPlatelets
          .severity,
    });

    reasoning.push(
      "Macroplaquetas descritas de forma consistente.",
    );

    correlations.push(
      "Distúrbio megacariocítico",
      "Turnover plaquetário aumentado",
      "Síndrome mieloproliferativa",
    );
  }

  // ==========================================================================
  // PLATELET AGGREGATION
  // ==========================================================================

  const aggregationFeatures = [

    "platelet aggregation",
    "platelet clumps",
    "platelet aggregates",
    "agregados plaquetários",
    "agregação plaquetária",
    "aglomerados plaquetários",
  ];

  const aggregationHits =
    countMatches(
      text,
      aggregationFeatures,
    );

  if (aggregationHits >= 2) {

    scores.plateletAggregation +=
      aggregationHits * 2;

    scores.pseudothrombocytopenia += 4;

    findings.push({

      type: "platelet_aggregation",

      detected: true,

      severity:
        PLATELET_MORPHOLOGY
          .plateletAggregation
          .severity,
    });

    alerts.push(
      "Possível pseudotrombocitopenia",
    );

    reasoning.push(
      "Agregados plaquetários podem reduzir contagem visual.",
    );

    correlations.push(
      "EDTA artifact",
      "Pseudothrombocytopenia",
      "Platelet clumping artifact",
    );
  }

  // ==========================================================================
  // VISUAL THROMBOCYTOPENIA
  // ==========================================================================

  const thrombocytopeniaFeatures = [

    "reduced platelets",
    "low platelets",
    "platelet scarcity",
    "scarce platelets",
    "plaquetas reduzidas",
    "plaquetas escassas",
    "plaquetopenia",
    "trombocitopenia",
  ];

  const thrombocytopeniaHits =
    countMatches(
      text,
      thrombocytopeniaFeatures,
    );

  if (thrombocytopeniaHits >= 2) {

    scores.thrombocytopenia +=
      thrombocytopeniaHits * 2;

    scores.coherenceScore += 4;

    findings.push({

      type: "visual_thrombocytopenia",

      detected: true,

      severity: "high",
    });

    alerts.push(
      "Possível trombocitopenia",
    );

    reasoning.push(
      "Escassez plaquetária descrita de forma consistente.",
    );

    correlations.push(
      "Peripheral destruction",
      "Consumptive coagulopathy",
      "Bone marrow suppression",
    );
  }

  // ==========================================================================
  // CONSUMPTIVE MICROANGIOPATHIC PATTERN
  // ==========================================================================

  const consumptiveFeatures = [

    "schistocyte",
    "esquizócito",
    "fragmented erythrocyte",
    "helmet cell",
    "microangiopathic",
    "dic",
    "ttp",
    "hus",
    "consumption",
  ];

  const consumptiveHits =
    countMatches(
      text,
      consumptiveFeatures,
    );

  // ==========================================================================
  // TRUE MICROANGIOPATHIC VALIDATION
  // ==========================================================================

  const trueConsumptivePattern =

    consumptiveHits >= 2

    &&

    thrombocytopeniaHits >= 1;

  if (trueConsumptivePattern) {

    scores.consumptivePattern +=
      consumptiveHits * 2;

    scores.coherenceScore += 6;

    correlations.push(
      "TTP",
      "HUS",
      "DIC",
      "Microangiopathic hemolysis",
    );

    alerts.push(
      "Possível consumo plaquetário microangiopático",
    );

    reasoning.push(
      "Padrão consumptivo associado a fragmentação eritrocitária.",
    );
  }

  // ==========================================================================
  // ARTIFACT DETECTION
  // ==========================================================================

  const artifactFeatures = [

    "artifact",
    "artefato",
    "smear artifact",
    "poor focus",
    "desfocado",
    "compressão",
    "compression artifact",
  ];

  const artifactHits =
    countMatches(
      text,
      artifactFeatures,
    );

  if (artifactHits >= 2) {

    scores.artifactPattern +=
      artifactHits * 2;

    contradictionFlags.push(
      "Artefatos podem limitar interpretação plaquetária.",
    );

    reasoning.push(
      "Qualidade microscópica reduz confiança plaquetária.",
    );
  }

  // ==========================================================================
  // CONSERVATIVE PLATELET VALIDATION
  // ==========================================================================

  const representativeFieldIndicators = [

    "platelets preserved in representative field",
    "plaquetas preservadas em campo representativo",

    "adequate platelet count in representative field",
    "contagem adequada em campo representativo",

    "platelets adequate in representative field",
  ];

  if (
    containsAny(
      text,
      representativeFieldIndicators,
    )
  ) {

    scores.thrombocytopenia -= 2;

    scores.consumptivePattern -= 2;

    reasoning.push(
      "Descrição plaquetária proveniente de campo representativo reduz discretamente a suspeita de padrão consumptivo.",
    );
  }

  // ==========================================================================
  // DOMINANT PATTERN
  // ==========================================================================

  const dominantPattern =
    detectDominantPattern(
      scores,
    );

  // ==========================================================================
  // EMERGENCY LEVEL
  // ==========================================================================

  const emergencyLevel =
    classifyEmergency(
      scores,
    );

  // ==========================================================================
  // RESULT
  // ==========================================================================

  return {

    plateletFindings:
      findings,

    plateletAlerts:
      unique(alerts),

    plateletCorrelations:
      unique(correlations),

    plateletReasoning:
      unique(reasoning),

    contradictionFlags:
      unique(
        contradictionFlags,
      ),

    plateletSummary:
      buildSummary(findings),

    dominantPlateletPattern:
      dominantPattern,

    plateletScores:
      scores,

    emergencyLevel,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function containsAny(
  text,
  keywords = [],
) {

  return keywords.some(
    keyword =>
      text.includes(
        keyword.toLowerCase(),
      ),
  );
}

// ============================================================================

function countMatches(
  text,
  keywords = [],
) {

  let count = 0;

  for (const keyword of keywords) {

    if (
      text.includes(
        keyword.toLowerCase(),
      )
    ) {
      count++;
    }
  }

  return count;
}

// ============================================================================

function detectDominantPattern(
  scores = {},
) {

  let max = 0;

  let dominant =
    "normal_platelet_pattern";

  for (const key in scores) {

    if (
      scores[key] > max
    ) {

      max =
        scores[key];

      dominant = key;
    }
  }

  return dominant;
}

// ============================================================================

function classifyEmergency(
  scores = {},
) {

  if (

    scores.consumptivePattern >= 8

    &&

    scores.thrombocytopenia >= 4
  ) {

    return "critical";
  }

  if (
    scores.thrombocytopenia >= 6
  ) {

    return "high";
  }

  if (
    scores.plateletAggregation >= 5
  ) {

    return "moderate";
  }

  return "low";
}

// ============================================================================

function unique(arr = []) {

  return [...new Set(arr)];
}

// ============================================================================

function buildSummary(
  findings = [],
) {

  if (
    findings.length === 0
  ) {

    return "Avaliação plaquetária sem alteração específica detectada pelo motor plaquetário; interpretar conforme representatividade do campo.";
  }

  return findings
    .map(
      item =>
        item.type.replaceAll(
          "_",
          " ",
        ),
    )
    .join(", ");
}