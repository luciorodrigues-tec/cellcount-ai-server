// ai/diagnosticCorrelationEngine.js
// ============================================================================
// CELLCOUNT ELITE HOSPITAL AI
// DIAGNOSTIC CORRELATION ENGINE V6 SAFE HYBRID
// ============================================================================

export function buildDiagnosticCorrelation({

  analysis = {},

  erythrocyteAnalysis = {},

  leukocyteAnalysis = {},

  plateletAnalysis = {},

  confidenceAnalysis = {},

  consensusAnalysis = {},

  analysisSource = "ai_visual",
}) {

  // ==========================================================================
  // FLAGS
  // ==========================================================================

  const manualMode =
    analysisSource === "manual";

  const hybridMode =
    analysisSource === "hybrid";

  const aiVisualMode =
    analysisSource === "ai_visual";

  const safeClinicalMode =
    consensusAnalysis
      ?.safeClinicalMode === true;

  const requiresHumanReview =
    confidenceAnalysis
      ?.requiresHumanReview === true;

  // ==========================================================================
  // FINDINGS
  // ==========================================================================

  const findings = [];

  const recommendations = [];

  const differentialDiagnosis = [];

  // ==========================================================================
  // ERYTHROCYTES
  // ==========================================================================

  if (
    erythrocyteAnalysis
      ?.anisocytosis === true
  ) {

    findings.push(
      "Discreta anisocitose observada.",
    );
  }

  if (
    erythrocyteAnalysis
      ?.schistocyteRisk === "high"
  ) {

    findings.push(
      "Presença de fragmentação eritrocitária.",
    );

    differentialDiagnosis.push({

      condition:
        "Microangiopatia",

      probability:
        "moderate",
    });
  }

  // ==========================================================================
  // LEUKOCYTES
  // ==========================================================================

  const blastRisk =
    leukocyteAnalysis
      ?.blastRisk || "low";

  if (
    blastRisk === "moderate"
  ) {

    findings.push(
      "Presença moderada de células imaturas.",
    );

    differentialDiagnosis.push({

      condition:
        "Alteração hematológica proliferativa",

      probability:
        "moderate",
    });
  }

  if (
    blastRisk === "high"
  ) {

    findings.push(
      "Aumento importante de células imaturas.",
    );

    differentialDiagnosis.push({

      condition:
        "Processo hematológico relevante",

      probability:
        "high",
    });
  }

  // ==========================================================================
  // PLATELETS
  // ==========================================================================

  if (
    plateletAnalysis
      ?.plateletClumping === true
  ) {

    findings.push(
      "Agregação plaquetária observada.",
    );
  }

  // ==========================================================================
  // MANUAL MODE SAFETY
  // ==========================================================================

  if (manualMode) {

    findings.push(
      "Resultado baseado em contagem manual informada pelo usuário.",
    );

    recommendations.push(
      "Correlação microscópica especializada recomendada.",
    );
  }

  // ==========================================================================
  // SAFE CLINICAL MODE
  // ==========================================================================

  if (safeClinicalMode) {

    recommendations.push(
      "Interpretação limitada por segurança clínica.",
    );
  }

  // ==========================================================================
  // HUMAN REVIEW
  // ==========================================================================

  if (requiresHumanReview) {

    recommendations.push(
      "Revisão hematológica humana recomendada.",
    );
  }

  // ==========================================================================
  // IMAGE QUALITY
  // ==========================================================================

  const imageQuality =
    analysis?.imageQuality
      ?.overallQuality || 0;

  if (imageQuality < 50) {

    recommendations.push(
      "Baixa qualidade de imagem pode limitar interpretação.",
    );
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  let summary =
    "Análise hematológica automatizada realizada.";

  if (findings.length > 0) {

    summary +=
      ` ${findings.join(" ")}`;
  }

  // ==========================================================================
  // SAFE LANGUAGE FILTER
  // ==========================================================================

  summary = sanitizeMedicalLanguage(
    summary,
  );

  // ==========================================================================
  // FINAL
  // ==========================================================================

  return {

    summary,

    findings,

    recommendations,

    differentialDiagnosis,

    requiresClinicalCorrelation:
      true,

    safeClinicalMode,

    requiresHumanReview,

    manualMode,

    hybridMode,

    aiVisualMode,

    confidenceLevel:
      confidenceAnalysis
        ?.confidenceLevel ||

      "low",

    engineVersion:
      "DIAGNOSTIC_CORRELATION_V6_SAFE_HYBRID",
  };
}

// ============================================================================
// SAFE LANGUAGE FILTER
// ============================================================================

function sanitizeMedicalLanguage(
  text,
) {

  if (!text) {

    return "";
  }

  return text

      .replaceAll(
        "leucemia",
        "alteração hematológica",
      )

      .replaceAll(
        "Leucemia",
        "Alteração hematológica",
      )

      .replaceAll(
        "neoplasia",
        "alteração hematológica",
      )

      .replaceAll(
        "malignidade",
        "alteração relevante",
      )

      .replaceAll(
        "processo blástico",
        "células imaturas",
      );
}