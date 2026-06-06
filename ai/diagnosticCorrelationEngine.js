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

  const reactiveLymphocytes =
    analysis?.findings?.reactiveLymphocytes === true ||
    leukocyteAnalysis?.reactiveLymphocytes === true;

  const atypicalLymphocytes =
    analysis?.findings?.atypicalLymphocytes === true ||
    leukocyteAnalysis?.atypicalLymphocytes === true;

  const largeMononuclearCells = Boolean(
    analysis?.findings?.largeMononuclearCells ||
    leukocyteAnalysis?.largeMononuclearCells
  );

  const monomorphicPopulation = Boolean(
    analysis?.findings?.monomorphicPopulation ||
    leukocyteAnalysis?.monomorphicPopulation
  );
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
// REACTIVE LYMPHOCYTE / MONONUCLEOSIS-LIKE PATTERN
// ==========================================================================

if (
  reactiveLymphocytes ||
  atypicalLymphocytes
) {
  findings.push(
    "Presença de linfócitos reativos/atípicos com padrão compatível com ativação imunológica.",
  );

  differentialDiagnosis.push({
    condition:
      "Resposta linfocitária reacional",
    probability:
      "high",
  });

  differentialDiagnosis.push({
    condition:
      "Síndrome mononucleósica / infecção viral",
    probability:
      "moderate",
  });

  recommendations.push(
    "Correlacionar com hemograma completo, linfocitose absoluta, sorologia para EBV/CMV e contexto clínico.",
  );
}

  if (
    largeMononuclearCells &&
    !monomorphicPopulation &&
    !reactiveLymphocytes &&
    !atypicalLymphocytes &&
    blastRisk === "low"
  ) {
    findings.push(
      "Células mononucleares grandes observadas sem critérios suficientes para definição de monócitos ou blastos.",
    );

    recommendations.push(
      "Considerar diferencial entre linfócitos reativos, monócitos maduros e imunoblastos, com revisão microscópica profissional.",
    );
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
      confidenceAnalysis?.confidenceLevel ||
      "moderate",

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