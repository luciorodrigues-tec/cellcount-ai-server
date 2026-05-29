// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY CONSENSUS ENGINE V7 HOSPITAL EDITION
// SAFE MULTI-LAYER CONSENSUS SYSTEM
// MANUAL / AI VISUAL / HYBRID SEPARATION
// ============================================================================

export function buildHematologyConsensus({

  analysis = {},

  leukocyteAnalysis = {},

  erythrocyteAnalysis = {},

  plateletAnalysis = {},

  confidenceAnalysis = {},

  diagnosticCorrelation = {},

  safetyValidation = {},

  analysisSource = "ai_visual",
}) {

  // ==========================================================================
  // BASE
  // ==========================================================================

  const consensus = {

    analysisSource,

    finalClassification: "indeterminate",

    clinicalPriority: "routine",

    overallRiskScore: 0,

    requiresHumanReview: false,

    safeClinicalMode: false,

    confidenceLevel: "low",

    summary: "",

    alerts: [],

    recommendations: [],

    diagnosticSuggestions: [],

    supportingFindings: [],

    rejectedFindings: [],

    visualEvidenceScore: 0,

    manualMode: analysisSource === "manual",

    hybridMode: analysisSource === "hybrid",

    aiVisualMode: analysisSource === "ai_visual",
  };

  // ==========================================================================
  // SAFETY
  // ==========================================================================

  const contradictionFlags =
    safetyValidation?.contradictionFlags || [];

  const safetyAlerts =
    safetyValidation?.alerts || [];

  const safetySeverity =
    safetyValidation?.severity || "low";

  // ==========================================================================
  // VISUAL EVIDENCE
  // ==========================================================================

  const visualEvidenceScore =
    calculateVisualEvidence({

      analysis,

      leukocyteAnalysis,

      erythrocyteAnalysis,
    });

  consensus.visualEvidenceScore =
    visualEvidenceScore;

  // ==========================================================================
  // MANUAL MODE
  // ==========================================================================

  if (analysisSource === "manual") {

    consensus.requiresHumanReview =
      true;

    consensus.safeClinicalMode =
      true;

    consensus.finalClassification =
      "manual_correlation_required";

    consensus.clinicalPriority =
      "review";

    consensus.summary =
      "Contagem diferencial manual detectada. Correlação microscópica obrigatória.";

    consensus.alerts.push(
      "Modo manual ativo.",
    );

    consensus.alerts.push(
      "Achados dependem de validação humana.",
    );
  }

  // ==========================================================================
  // SCORES
  // ==========================================================================

  const blastConfidence =
    normalize(

      analysis
        ?.morphologicConfidenceMatrix
        ?.blastAssessment
        ?.confidence || 0,
    );

  const schistocyteConfidence =
    normalize(

      analysis
        ?.morphologicConfidenceMatrix
        ?.schistocyteAssessment
        ?.confidence || 0,
    );

  const dysplasiaConfidence =
    normalize(

      analysis
        ?.morphologicConfidenceMatrix
        ?.dysplasiaAssessment
        ?.confidence || 0,
    );

  // ==========================================================================
  // BLAST SAFETY
  // ==========================================================================

  const immatureDetected =
    leukocyteAnalysis
      ?.immatureFeaturesDetected || false;

  const blastRisk =
    leukocyteAnalysis
      ?.blastRisk || "low";

  const noLeukocytesDetected =
    !leukocyteAnalysis
      ?.leukocyteFindings ||

    leukocyteAnalysis
      ?.leukocyteFindings
      ?.length === 0;

  // ==========================================================================
  // INVALID BLAST
  // ==========================================================================

  if (
    noLeukocytesDetected &&
    blastConfidence > 25
  ) {

    consensus.rejectedFindings.push(
      "Suspeita blástica rejeitada por ausência de leucócitos detectáveis.",
    );
  }

  // ==========================================================================
  // SAFE BLAST DETECTION
  // ==========================================================================

  const safeBlastDetection = (

    blastConfidence >= 65 &&

    immatureDetected &&

    blastRisk !== "low" &&

    visualEvidenceScore >= 45 &&

    contradictionFlags.length <= 2 &&

    analysisSource !== "manual"
  );

  // ==========================================================================
  // PROLIFERATIVE
  // ==========================================================================

  if (safeBlastDetection) {

    consensus.finalClassification =
      "proliferative_pattern";

    consensus.clinicalPriority =
      "urgent";

    consensus.overallRiskScore =
      normalize(

        blastConfidence * 0.9,
      );

    consensus.requiresHumanReview =
      true;

    consensus.alerts.push(
      "Presença de padrão proliferativo/imaturidade hematológica.",
    );

    consensus.recommendations.push(
      "Correlação hematológica especializada.",
    );

    consensus.recommendations.push(
      "Revisão microscópica obrigatória.",
    );

    consensus.diagnosticSuggestions.push(
      "Investigação de processo proliferativo hematológico.",
    );

    consensus.supportingFindings.push(
      "Presença de células imaturas.",
    );
  }

  // ==========================================================================
  // SCHISTOCYTES
  // ==========================================================================

  if (
    schistocyteConfidence >= 70 &&

    analysisSource !== "manual"
  ) {

    consensus.alerts.push(
      "Fragmentação eritrocitária relevante detectada.",
    );

    consensus.diagnosticSuggestions.push(
      "Investigar hemólise microangiopática.",
    );

    consensus.supportingFindings.push(
      "Presença de fragmentação eritrocitária.",
    );

    consensus.requiresHumanReview =
      true;
  }

  // ==========================================================================
  // DYSPLASIA
  // ==========================================================================

  if (
    dysplasiaConfidence >= 60
  ) {

    consensus.supportingFindings.push(
      "Alterações displásicas identificadas.",
    );

    consensus.diagnosticSuggestions.push(
      "Correlacionar com avaliação medular.",
    );
  }

  // ==========================================================================
  // LOW QUALITY
  // ==========================================================================

  const quality =
    normalizeQuality(

      analysis
        ?.microscopyQualityScore
        ?.overall || 55,
    );

  if (quality < 45) {

    consensus.requiresHumanReview =
      true;

    consensus.safeClinicalMode =
      true;

    consensus.alerts.push(
      "Baixa qualidade microscópica.",
    );

    consensus.recommendations.push(
      "Nova captura de imagem recomendada.",
    );
  }

  // ==========================================================================
  // SAFETY SEVERITY
  // ==========================================================================

  if (
    safetySeverity === "high" ||

    safetySeverity === "critical"
  ) {

    consensus.requiresHumanReview =
      true;

    consensus.safeClinicalMode =
      true;

    consensus.alerts.push(
      "Resultado com inconsistências hematológicas.",
    );
  }

  // ==========================================================================
  // NO VISUAL EVIDENCE
  // ==========================================================================

  if (
    visualEvidenceScore < 25
  ) {

    consensus.requiresHumanReview =
      true;

    consensus.safeClinicalMode =
      true;

    consensus.alerts.push(
      "Baixa evidência visual automatizada.",
    );

    consensus.recommendations.push(
      "Revisão microscópica recomendada.",
    );
  }

  // ==========================================================================
  // MANUAL SAFETY LOCK
  // ==========================================================================

  if (analysisSource === "manual") {

    consensus.finalClassification =
      "manual_correlation_required";

    consensus.overallRiskScore =
      Math.min(
        consensus.overallRiskScore,
        45,
      );

    consensus.diagnosticSuggestions =
      sanitizeDiagnosticSuggestions(

        consensus
          .diagnosticSuggestions,
      );
  }

  // ==========================================================================
  // TEXT SANITIZATION
  // ==========================================================================

  consensus.summary =
    sanitizeDiagnosticLanguage(
      consensus.summary,
    );

  consensus.alerts =
    consensus.alerts.map(
      sanitizeDiagnosticLanguage,
    );

  consensus.recommendations =
    consensus.recommendations.map(
      sanitizeDiagnosticLanguage,
    );

  consensus.diagnosticSuggestions =
    consensus.diagnosticSuggestions.map(
      sanitizeDiagnosticLanguage,
    );

  // ==========================================================================
  // CONFIDENCE LEVEL
  // ==========================================================================

  consensus.confidenceLevel =
    buildConfidenceLevel({

      visualEvidenceScore,

      contradictionFlags,

      quality,
    });

  // ==========================================================================
  // FINAL DEFAULT
  // ==========================================================================

  if (
    consensus.summary
      .trim()
      .length === 0
  ) {

    consensus.summary =
      "Achados hematológicos inespecíficos. Correlação clínica recomendada.";
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {

    ...consensus,

    alerts:
      unique(consensus.alerts),

    recommendations:
      unique(
        consensus.recommendations,
      ),

    diagnosticSuggestions:
      unique(
        consensus
          .diagnosticSuggestions,
      ),

    supportingFindings:
      unique(
        consensus
          .supportingFindings,
      ),

    rejectedFindings:
      unique(
        consensus
          .rejectedFindings,
      ),
  };
}

// ============================================================================
// VISUAL EVIDENCE
// ============================================================================

function calculateVisualEvidence({

  analysis,

  leukocyteAnalysis,

  erythrocyteAnalysis,
}) {

  let score = 0;

  const heatmaps =
    analysis?.heatmapRegions || [];

  const leukocyteFindings =
    leukocyteAnalysis
      ?.leukocyteFindings || [];

  const immature =
    leukocyteAnalysis
      ?.immatureFeaturesDetected || false;

  const blastRisk =
    leukocyteAnalysis
      ?.blastRisk || "low";

  const erythroMorphology =
    erythrocyteAnalysis
      ?.dominantMorphology || "";

  // ==========================================================================
  // HEATMAPS
  // ==========================================================================

  if (heatmaps.length > 0) {

    score += 25;
  }

  // ==========================================================================
  // LEUKOCYTES
  // ==========================================================================

  if (
    leukocyteFindings.length > 0
  ) {

    score += 30;
  }

  // ==========================================================================
  // IMMATURE
  // ==========================================================================

  if (immature) {

    score += 25;
  }

  // ==========================================================================
  // BLAST
  // ==========================================================================

  if (
    blastRisk === "high" ||
    blastRisk === "moderate"
  ) {

    score += 20;
  }

  // ==========================================================================
  // RBC
  // ==========================================================================

  if (
    erythroMorphology
      .length > 0
  ) {

    score += 10;
  }

  return normalize(score);
}

// ============================================================================
// SANITIZATION
// ============================================================================

function sanitizeDiagnosticLanguage(
  text = "",
) {

  return text

    .replace(
      /leucemia/gi,
      "alteração hematológica",
    )

    .replace(
      /neoplasia/gi,
      "processo hematológico",
    )

    .replace(
      /malignidade/gi,
      "alteração relevante",
    )

    .replace(
      /processo bl[aá]stico/gi,
      "células imaturas",
    )

    .replace(
      /c[aâ]ncer/gi,
      "condição hematológica",
    );
}

// ============================================================================
// SUGGESTIONS
// ============================================================================

function sanitizeDiagnosticSuggestions(
  arr = [],
) {

  return arr.map(
    sanitizeDiagnosticLanguage,
  );
}

// ============================================================================
// CONFIDENCE LEVEL
// ============================================================================

function buildConfidenceLevel({

  visualEvidenceScore,

  contradictionFlags,

  quality,
}) {

  let score = 0;

  score += visualEvidenceScore;

  score += quality * 0.5;

  score -=
    contradictionFlags.length * 12;

  if (score >= 80) {
    return "high";
  }

  if (score >= 50) {
    return "moderate";
  }

  return "low";
}

// ============================================================================
// NORMALIZE
// ============================================================================

function normalize(
  value,
) {

  return Math.max(

    0,

    Math.min(
      100,
      Math.round(value),
    ),
  );
}

// ============================================================================
// QUALITY
// ============================================================================

function normalizeQuality(
  value,
) {

  if (value <= 5) {

    return normalize(
      value * 20,
    );
  }

  return normalize(value);
}

// ============================================================================
// UNIQUE
// ============================================================================

function unique(
  arr = [],
) {

  return [...new Set(arr)];
}