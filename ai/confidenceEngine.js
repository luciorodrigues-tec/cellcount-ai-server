// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY CONFIDENCE ENGINE V4
// ENTERPRISE MULTI-ENGINE CLINICAL CALIBRATION
// Safety V8.3 + Blast Engine + YOLO Fusion + Semantic Evidence
// ============================================================================

export function buildConfidenceAnalysis({
  analysis,
  extractedText = "",
  consensusResult = null,
  imageQuality = null,
  erythrocyteAnalysis = null,
  leukocyteAnalysis = null,
  plateletAnalysis = null,
  diagnosticCorrelation = null,
}) {
  if (!analysis) {
    return buildEmptyConfidence();
  }

  const text = normalizeText(
    [
      extractedText,
      JSON.stringify(analysis || {}),
      JSON.stringify(erythrocyteAnalysis || {}),
      JSON.stringify(leukocyteAnalysis || {}),
      JSON.stringify(plateletAnalysis || {}),
      JSON.stringify(diagnosticCorrelation || {}),
      JSON.stringify(consensusResult || {}),
    ].join(" "),
  );

  const safetyValidation =
    analysis?.safetyValidation || {};

  const blastMorphologyAnalysis =
    analysis?.blastMorphologyAnalysis || {};

  const yoloFusion =
    analysis?.yoloFusion || {};

  const visualEvidence =
    analysis?.visualEvidence || {};

  const qualityScore = normalizeQuality(
    imageQuality ||
      analysis?.microscopyQualityScore?.overall ||
      visualEvidence?.imageReliability ||
      analysis?.imageQuality?.confidence ||
      55,
  );

  const counts =
    analysis?.counts || {};

  const matrix =
    analysis?.morphologicConfidenceMatrix || {};

  const consensusMatrix =
    consensusResult?.confidenceMatrix || {};

  const safetyProfile =
    buildSafetyProfile({
      safetyValidation,
      visualEvidence,
      yoloFusion,
      qualityScore,
      text,
      analysis,
    });

  const blastConfidence =
    calculateBlastConfidence({
      analysis,
      matrix,
      counts,
      qualityScore,
      consensusMatrix,
      leukocyteAnalysis,
      text,
      safetyProfile,
      blastMorphologyAnalysis,
      yoloFusion,
    });

  const schistocyteConfidence =
    calculateSchistocyteConfidence({
      matrix,
      analysis,
      qualityScore,
      consensusMatrix,
      erythrocyteAnalysis,
      text,
      safetyProfile,
    });

  const erythrocyteConfidence =
    calculateErythrocyteConfidence({
      analysis,
      qualityScore,
      erythrocyteAnalysis,
      text,
      safetyProfile,
    });

  const plateletConfidence =
    calculatePlateletConfidence({
      analysis,
      qualityScore,
      plateletAnalysis,
      text,
      safetyProfile,
    });

  const inflammatoryPatternConfidence =
    calculateInflammatoryConfidence({
      counts,
      matrix,
      qualityScore,
      leukocyteAnalysis,
      text,
      safetyProfile,
    });

  const dysplasiaConfidence =
    calculateDysplasiaConfidence({
      matrix,
      qualityScore,
      consensusMatrix,
      text,
      safetyProfile,
    });

  const diagnosticCoherenceConfidence =
    calculateDiagnosticCoherence({
      diagnosticCorrelation,
      qualityScore,
      safetyProfile,
      consensusResult,
    });

  const globalConfidenceScore =
    calculateGlobalScore({
      blastConfidence,
      schistocyteConfidence,
      erythrocyteConfidence,
      plateletConfidence,
      inflammatoryPatternConfidence,
      dysplasiaConfidence,
      diagnosticCoherenceConfidence,
      safetyProfile,
    });

  const hematologicRisk =
    calculateRiskCategory({
      blastConfidence,
      schistocyteConfidence,
      dysplasiaConfidence,
      inflammatoryPatternConfidence,
      diagnosticCorrelation,
      safetyProfile,
    });

  return {
    globalConfidenceScore,

    hematologicRisk,

    microscopyQuality: {
      score: qualityScore,
      classification: classifyQuality(qualityScore),
    },

    confidenceMatrix: {
      blastConfidence,
      schistocyteConfidence,
      erythrocyteConfidence,
      plateletConfidence,
      inflammatoryPatternConfidence,
      dysplasiaConfidence,
      diagnosticCoherenceConfidence,
    },

    confidenceHierarchy: {
      cellLevel: calculateCellLevelConfidence({
        erythrocyteConfidence,
        plateletConfidence,
        inflammatoryPatternConfidence,
        safetyProfile,
      }),

      morphologyLevel: calculateMorphologyLevelConfidence({
        erythrocyteConfidence,
        blastConfidence,
        schistocyteConfidence,
        dysplasiaConfidence,
        safetyProfile,
      }),

      diagnosticLevel: diagnosticCoherenceConfidence,

      global: globalConfidenceScore,
    },

    calibration: {
      version: "V4_ENTERPRISE_SAFETY_AWARE",
      strategy: "safety_weighted_multiengine_confidence",
      safetyAware: true,
      visualEvidenceAware: true,
      yoloFusionAware: true,
      overcallingSuppression: true,
      undercallingProtection: true,
      semanticExtractionAware: true,
    },

    safetySignals: {
      visualEvidenceScore: safetyProfile.visualEvidenceScore,
      diagnosticReliability: safetyProfile.diagnosticReliability,
      morphologyCoherence: safetyProfile.morphologyCoherence,
      artifactProbability: safetyProfile.artifactProbability,
      falsePositiveRisk: safetyProfile.falsePositiveRisk,
      safeDiagnosticGate: safetyProfile.safeDiagnosticGate,
    },

    summary: buildSummary({
      globalConfidenceScore,
      hematologicRisk,
      blastConfidence,
      schistocyteConfidence,
      erythrocyteConfidence,
      plateletConfidence,
      diagnosticCoherenceConfidence,
      safetyProfile,
    }),
  };
}

// ============================================================================
// SAFETY PROFILE
// ============================================================================

function buildSafetyProfile({
  safetyValidation = {},
  visualEvidence = {},
  yoloFusion = {},
  qualityScore = 55,
  text = "",
  analysis = {},
}) {
  const visualEvidenceScore =
    normalize(
      safetyValidation?.visualEvidenceScore ||
        visualEvidence?.visualEvidenceScore ||
        0,
    );

  const diagnosticReliability =
    normalize(
      safetyValidation?.diagnosticReliability ||
        analysis?.metadata?.diagnosticReliability ||
        0,
    );

  const morphologyCoherence =
    normalize(
      safetyValidation?.morphologyCoherence ||
        analysis?.metadata?.morphologyCoherence ||
        0,
    );

  const artifactProbability =
    normalize(
      safetyValidation?.artifactProbability ||
        analysis?.metadata?.artifactProbability ||
        0,
    );

  const falsePositiveRisk =
    normalize(
      safetyValidation?.falsePositiveRisk ||
        analysis?.metadata?.falsePositiveRisk ||
        0,
    );

  const blastMorphologySignal =
    safetyValidation?.blastMorphologySignal || {};

  const safeDiagnosticGate =
    safetyValidation?.safeDiagnosticGate === true ||
    analysis?.metadata?.safeDiagnosticGate === true;

  const yoloAvailable =
    yoloFusion?.available === true;

  const yoloFusionConfidence =
    normalize(
      yoloFusion?.fusionConfidence || 0,
    );

  const hasRealVisualEvidence =
    visualEvidenceScore >= 55 ||
    diagnosticReliability >= 55 ||
    morphologyCoherence >= 55 ||
    containsAny(text, [
      "neutrofil",
      "linfocit",
      "plaquet",
      "eritrocit",
      "hemacia",
      "erythrocyte",
      "platelet",
      "leukocyte",
    ]);

  const normalPattern =
    containsAny(text, [
      "sem alteracoes",
      "sem alterações",
      "morfologia normal",
      "baixo risco",
      "low risk",
      "normal pattern",
      "no significant",
      "not observed",
    ]);

  return {
    visualEvidenceScore,
    diagnosticReliability,
    morphologyCoherence,
    artifactProbability,
    falsePositiveRisk,
    blastMorphologySignal,
    safeDiagnosticGate,
    yoloAvailable,
    yoloFusionConfidence,
    hasRealVisualEvidence,
    normalPattern,
    qualityScore,
  };
}

// ============================================================================
// BLAST CONFIDENCE V4
// ============================================================================

function calculateBlastConfidence({
  matrix,
  counts,
  qualityScore,
  consensusMatrix,
  leukocyteAnalysis,
  text,
  analysis,
  safetyProfile,
  blastMorphologyAnalysis,
  yoloFusion,
}) {
  let score =
    Number(matrix?.blastAssessment?.confidence || 0);

  const blastCount =
    counts?.Blasto || counts?.blast || 0;

  const blastRisk =
    leukocyteAnalysis?.blastRisk || "low";

  const leukocyteScores =
    leukocyteAnalysis?.leukocyteScores || {};

  const blastMorphologyConfidence =
    Number(blastMorphologyAnalysis?.confidence || 0);

  const blastPresent =
    blastMorphologyAnalysis?.present === true;

  const safetyBlastSignal =
    safetyProfile?.blastMorphologySignal || {};

  const safetyBlastConfidence =
    Number(safetyBlastSignal?.confidence || 0);

  const safetyBlastPresent =
    safetyBlastSignal?.present === true;

  const yoloBlastSignal =
    yoloFusion?.blastSpatialSignal || {};

  const yoloBlastPresent =
    yoloBlastSignal?.present === true;

  const yoloBlastScore =
    Number(yoloBlastSignal?.score || 0);

  if (blastCount >= 1) score += 10;
  if (blastCount >= 5) score += 18;
  if (blastCount >= 10) score += 28;

  if (blastRisk === "minimal") score += 8;
  if (blastRisk === "moderate") score += 18;
  if (blastRisk === "high") score += 34;

  if (leukocyteAnalysis?.immatureFeaturesDetected) {
    score += 14;
  }

  const morphologyCriteria = [
    hasPositiveFinding(text, ["nucleolo", "nucleoli", "nucléolo"]),
    hasPositiveFinding(text, ["cromatina fina", "fine chromatin", "open chromatin"]),
    hasPositiveFinding(text, ["relacao nucleo citoplasma", "nucleus cytoplasm", "alta relacao"]),
    hasPositiveFinding(text, ["celulas imaturas", "immature cells"]),
    hasPositiveFinding(text, ["blastos suspeitos", "suspected blasts"]),
  ].filter(Boolean).length;

  if (morphologyCriteria >= 2) score += 14;
  if (morphologyCriteria >= 3) score += 24;
  if (morphologyCriteria >= 4) score += 34;

  if (blastPresent) {
    score = Math.max(score, blastMorphologyConfidence * 0.70);
  }

  if (safetyBlastPresent) {
    score = Math.max(score, safetyBlastConfidence * 0.72);
  }

  if (yoloBlastPresent) {
    score = Math.max(score, yoloBlastScore * 0.75);
  }

  if (blastMorphologyConfidence >= 60) score += 10;
  if (blastMorphologyConfidence >= 80) score += 16;

  if (safetyBlastConfidence >= 60) score += 8;
  if (safetyBlastConfidence >= 80) score += 12;

  if (leukocyteScores?.maturationCoherence >= 5) score -= 5;

  if (
    leukocyteAnalysis?.primaryPattern === "mature_pattern" ||
    leukocyteAnalysis?.primaryPattern === "normal_pattern"
  ) {
    score -= 10;
  }

  if (
    safetyProfile?.normalPattern &&
    !blastPresent &&
    !safetyBlastPresent &&
    !yoloBlastPresent
  ) {
    score = Math.min(score, 12);
  }

  if (
    safetyProfile?.falsePositiveRisk >= 50 &&
    !yoloBlastPresent
  ) {
    score *= 0.55;
  }

  if (
    safetyProfile?.safeDiagnosticGate === true &&
    !blastPresent &&
    !safetyBlastPresent &&
    !yoloBlastPresent
  ) {
    score = Math.min(score, 18);
  }

  if (consensusMatrix?.blastConsensus) {
    score = weightedAverage(
      score,
      consensusMatrix.blastConsensus,
      0.80,
    );
  }

  if (score >= 55) {
    score = applyQualityAdjustment(score, qualityScore, "standard");
  } else {
    score = applyQualityAdjustment(score, qualityScore, "critical");
  }

  if (
    (blastMorphologyConfidence >= 80 || safetyBlastConfidence >= 80) &&
    morphologyCriteria >= 3
  ) {
    score = Math.max(score, 65);
  } else if (
    (blastMorphologyConfidence >= 70 || safetyBlastConfidence >= 70) &&
    morphologyCriteria >= 3
  ) {
    score = Math.max(score, 55);
  } else if (
    (blastMorphologyConfidence >= 50 || safetyBlastConfidence >= 50) &&
    morphologyCriteria >= 2
  ) {
    score = Math.max(score, 40);
  }

  return normalize(score);
}

// ============================================================================
// SCHISTOCYTE CONFIDENCE
// ============================================================================

function calculateSchistocyteConfidence({
  matrix,
  analysis,
  qualityScore,
  consensusMatrix,
  erythrocyteAnalysis,
  text,
  safetyProfile,
}) {
  let score =
    Number(matrix?.schistocyteAssessment?.confidence || 0);

  const morphologies =
    analysis?.morphologies || [];

  const rbcScores =
    erythrocyteAnalysis?.morphologyScores || {};

  if (
    morphologies.includes("Esquizócitos") ||
    morphologies.includes("Esquizocitos")
  ) {
    score += 10;
  }

  if (rbcScores.schistocyte >= 8) score += 22;

  if (erythrocyteAnalysis?.dominantMorphology === "schistocyte") {
    score += 18;
  }

  if (
    hasPositiveFinding(text, [
      "fragmentacao",
      "fragmentação",
      "fragmented erythrocyte",
      "helmet cell",
      "esquizocito",
      "esquizócito",
      "schistocyte",
    ])
  ) {
    score += 14;
  }

  if (erythrocyteAnalysis?.dominantMorphology === "acanthocyte") {
    score -= 8;
  }

  if (rbcScores.acanthocyte > rbcScores.schistocyte) {
    score -= 6;
  }

  if (
    safetyProfile?.normalPattern &&
    !hasPositiveFinding(text, [
      "esquizocito",
      "esquizócito",
      "schistocyte",
    ])
  ) {
    score = Math.min(score, 10);
  }

  if (consensusMatrix?.schistocyteConsensus) {
    score = weightedAverage(
      score,
      consensusMatrix.schistocyteConsensus,
      0.70,
    );
  }

  if (score >= 40) {
    score = applyQualityAdjustment(score, qualityScore, "standard");
  } else {
    score = applyQualityAdjustment(score, qualityScore, "critical");
  }

  return normalize(score);
}

// ============================================================================
// ERYTHROCYTE CONFIDENCE
// ============================================================================

function calculateErythrocyteConfidence({
  analysis,
  qualityScore,
  erythrocyteAnalysis,
  text,
  safetyProfile,
}) {
  let score = 18;

  const morphologies =
    analysis?.morphologies || [];

  const rbcScores =
    erythrocyteAnalysis?.morphologyScores || {};

  if (morphologies.length > 0) {
    score += 18;
  }

  if (
    hasPositiveFinding(text, [
      "anisocitose",
      "poiquilocitose",
      "anisopoiquilocitose",
      "acantocito",
      "acantocitos",
      "codocito",
      "rouleaux",
      "drepanocito",
      "schistocyte",
      "esquizocito",
      "esquizócito",
      "erythrocyte",
      "eritrocito",
      "eritrócito",
      "hemacia",
      "hemácia",
    ])
  ) {
    score += 28;
  }

  if (
    erythrocyteAnalysis?.dominantMorphology &&
    erythrocyteAnalysis?.dominantMorphology !== "normal_pattern"
  ) {
    score += 22;
  }

  if (erythrocyteAnalysis?.dominantMorphology === "normal_pattern") {
    score += 18;
  }

  if (rbcScores.coherenceScore >= 4) {
    score += 15;
  }

  if (erythrocyteAnalysis?.morphologicRisk === "high") {
    score += 12;
  }

  if (erythrocyteAnalysis?.morphologicRisk === "critical") {
    score += 20;
  }

  if (rbcScores.artifactPattern >= 4) {
    score -= 10;
  }

  if (
    safetyProfile?.hasRealVisualEvidence ||
    safetyProfile?.visualEvidenceScore >= 55
  ) {
    score += 12;
  }

  if (safetyProfile?.normalPattern) {
    score = Math.max(score, 52);
  }

  score =
    applyQualityAdjustment(
      score,
      qualityScore,
      "standard",
    );

  return normalize(score);
}

// ============================================================================
// PLATELET CONFIDENCE
// ============================================================================

function calculatePlateletConfidence({
  analysis,
  qualityScore,
  plateletAnalysis,
  text,
  safetyProfile,
}) {
  let score = 38;

  const plateletScores =
    plateletAnalysis?.plateletScores || {};

  if (
    hasPositiveFinding(text, [
      "plaquetas preservadas",
      "plaquetas presentes",
      "plaquetas",
      "platelets",
      "adequado",
      "adequate",
      "sem alteracoes plaquetarias",
      "sem alterações plaquetárias",
    ])
  ) {
    score += 16;
  }

  if (plateletScores.plateletAggregation >= 5) {
    score += 14;
  }

  if (plateletScores.thrombocytopenia >= 6) {
    score += 18;
  }

  if (plateletScores.consumptivePattern >= 8) {
    score += 20;
  }

  if (plateletScores.artifactPattern >= 4) {
    score -= 12;
  }

  if (
    plateletAnalysis?.dominantPlateletPattern === "normal_platelet_pattern"
  ) {
    score += 12;
  }

  if (
    safetyProfile?.hasRealVisualEvidence ||
    safetyProfile?.visualEvidenceScore >= 55
  ) {
    score += 8;
  }

  score =
    applyQualityAdjustment(
      score,
      qualityScore,
      "standard",
    );

  return normalize(score);
}

// ============================================================================
// INFLAMMATORY CONFIDENCE
// ============================================================================

function calculateInflammatoryConfidence({
  counts,
  matrix,
  qualityScore,
  leukocyteAnalysis,
  text,
  safetyProfile,
}) {
  let score = 0;

  const segmented =
    counts?.Segmentado ||
    counts?.segmentado ||
    counts?.Neutrofilo ||
    counts?.neutrophil ||
    0;

  const bastonete =
    counts?.Bastonete ||
    counts?.bastonete ||
    counts?.band ||
    0;

  const leukocyteScores =
    leukocyteAnalysis?.leukocyteScores || {};

  if (segmented >= 70) score += 18;
  if (bastonete >= 10) score += 22;

  score +=
    (matrix?.leftShiftAssessment?.confidence || 0) * 0.35;

  if (leukocyteScores.leftShift >= 7) score += 18;
  if (leukocyteScores.toxicChanges >= 6) score += 20;
  if (leukocyteScores.inflammatoryActivation >= 4) score += 12;

  if (
    hasPositiveFinding(text, [
      "granulacao toxica",
      "granulação tóxica",
      "desvio a esquerda",
      "desvio à esquerda",
      "bastonete",
      "band neutrophil",
      "band cell",
    ])
  ) {
    score += 12;
  }

  if (
    leukocyteAnalysis?.primaryPattern === "mature_pattern" ||
    leukocyteAnalysis?.primaryPattern === "normal_pattern"
  ) {
    score = Math.max(score, 8);
  }

  if (
    safetyProfile?.normalPattern &&
    !hasPositiveFinding(text, [
      "desvio a esquerda",
      "desvio à esquerda",
      "toxic",
      "toxica",
      "tóxica",
      "bastonete",
    ])
  ) {
    score = Math.min(score, 12);
  }

  score =
    applyQualityAdjustment(
      score,
      qualityScore,
      "standard",
    );

  return normalize(score);
}

// ============================================================================
// DYSPLASIA CONFIDENCE
// ============================================================================

function calculateDysplasiaConfidence({
  matrix,
  qualityScore,
  consensusMatrix,
  text,
  safetyProfile,
}) {
  let score =
    Number(matrix?.dysplasiaAssessment?.confidence || 0);

  if (
    hasPositiveFinding(text, [
      "displasia",
      "hipogranulacao",
      "hipogranulação",
      "hipossegmentacao",
      "hipossegmentação",
      "dysplasia",
    ])
  ) {
    score += 12;
  }

  if (consensusMatrix?.dysplasiaConsensus) {
    score =
      weightedAverage(
        score,
        consensusMatrix.dysplasiaConsensus,
        0.70,
      );
  }

  if (
    safetyProfile?.normalPattern &&
    !hasPositiveFinding(text, ["displasia", "dysplasia"])
  ) {
    score = Math.min(score, 10);
  }

  score =
    applyQualityAdjustment(
      score,
      qualityScore,
      "critical",
    );

  return normalize(score);
}

// ============================================================================
// DIAGNOSTIC COHERENCE
// ============================================================================

function calculateDiagnosticCoherence({
  diagnosticCorrelation,
  qualityScore,
  safetyProfile,
  consensusResult,
}) {
  let score = 0;

  const suggestions =
    diagnosticCorrelation?.diagnosticSuggestions ||
    diagnosticCorrelation?.differentialDiagnosis ||
    [];

  const findings =
    diagnosticCorrelation?.findings || [];

  const contradictionFlags =
    diagnosticCorrelation?.contradictionFlags || [];

  const criticalAlerts =
    diagnosticCorrelation?.criticalAlerts || [];

  if (suggestions.length > 0) score += 18;
  if (findings.length > 0) score += 12;

  for (const suggestion of suggestions) {
    if (suggestion.confidence === "minimal") score += 5;
    if (suggestion.confidence === "moderate") score += 10;
    if (suggestion.confidence === "high") score += 20;
    if (suggestion.coherenceScore) score += suggestion.coherenceScore * 2;
  }

  if (criticalAlerts.length > 0) score += 15;

  if (contradictionFlags.length > 0) {
    score -= contradictionFlags.length * 4;
  }

  if (safetyProfile?.safeDiagnosticGate === true) {
    score += 18;
  }

  if (safetyProfile?.diagnosticReliability >= 70) {
    score += 20;
  } else if (safetyProfile?.diagnosticReliability >= 55) {
    score += 12;
  }

  if (safetyProfile?.morphologyCoherence >= 80) {
    score += 14;
  } else if (safetyProfile?.morphologyCoherence >= 60) {
    score += 8;
  }

  if (consensusResult?.confidenceLevel === "high") {
    score += 12;
  }

  score =
    applyQualityAdjustment(
      score,
      qualityScore,
      "standard",
    );

  return normalize(score);
}

// ============================================================================
// GLOBAL SCORE
// ============================================================================

function calculateGlobalScore({
  blastConfidence,
  schistocyteConfidence,
  erythrocyteConfidence,
  plateletConfidence,
  inflammatoryPatternConfidence,
  dysplasiaConfidence,
  diagnosticCoherenceConfidence,
  safetyProfile,
}) {
  let score =
    blastConfidence * 0.10 +
    schistocyteConfidence * 0.10 +
    erythrocyteConfidence * 0.20 +
    plateletConfidence * 0.15 +
    inflammatoryPatternConfidence * 0.10 +
    dysplasiaConfidence * 0.08 +
    diagnosticCoherenceConfidence * 0.27;

  if (safetyProfile?.visualEvidenceScore >= 80) {
    score += 8;
  } else if (safetyProfile?.visualEvidenceScore >= 60) {
    score += 5;
  }

  if (safetyProfile?.diagnosticReliability >= 80) {
    score += 8;
  } else if (safetyProfile?.diagnosticReliability >= 65) {
    score += 5;
  }

  if (safetyProfile?.safeDiagnosticGate === true) {
    score += 5;
  }

  if (
    safetyProfile?.normalPattern &&
    blastConfidence <= 20 &&
    schistocyteConfidence <= 20
  ) {
    score = Math.max(score, 68);
  }

  if (
    safetyProfile?.hasRealVisualEvidence &&
    safetyProfile?.diagnosticReliability >= 70
  ) {
    score = Math.max(score, 72);
  }

  if (safetyProfile?.falsePositiveRisk >= 55) {
    score -= 10;
  }

  return normalize(score);
}

// ============================================================================
// RISK CATEGORY
// ============================================================================

function calculateRiskCategory({
  blastConfidence,
  schistocyteConfidence,
  dysplasiaConfidence,
  inflammatoryPatternConfidence,
  diagnosticCorrelation,
  safetyProfile,
}) {
  let riskScore =
    blastConfidence * 0.42 +
    schistocyteConfidence * 0.28 +
    dysplasiaConfidence * 0.18 +
    inflammatoryPatternConfidence * 0.12;

  if (diagnosticCorrelation?.globalRisk === "critical") {
    riskScore += 20;
  }

  if (diagnosticCorrelation?.globalRisk === "high") {
    riskScore += 10;
  }

  if (
    safetyProfile?.normalPattern &&
    blastConfidence <= 20 &&
    schistocyteConfidence <= 20 &&
    dysplasiaConfidence <= 20
  ) {
    riskScore = Math.min(riskScore, 15);
  }

  if (safetyProfile?.falsePositiveRisk >= 60) {
    riskScore += 10;
  }

  if (riskScore >= 75) {
    return {
      level: "critical",
      score: normalize(riskScore),
      label: "ALTO RISCO HEMATOLÓGICO",
    };
  }

  if (riskScore >= 45) {
    return {
      level: "moderate",
      score: normalize(riskScore),
      label: "RISCO MODERADO",
    };
  }

  return {
    level: "low",
    score: normalize(riskScore),
    label: "BAIXO RISCO",
  };
}

// ============================================================================
// HIERARCHY
// ============================================================================

function calculateCellLevelConfidence({
  erythrocyteConfidence,
  plateletConfidence,
  inflammatoryPatternConfidence,
  safetyProfile,
}) {
  let score =
    erythrocyteConfidence * 0.45 +
    plateletConfidence * 0.25 +
    inflammatoryPatternConfidence * 0.30;

  if (safetyProfile?.hasRealVisualEvidence) {
    score = Math.max(score, 60);
  }

  return normalize(score);
}

function calculateMorphologyLevelConfidence({
  erythrocyteConfidence,
  blastConfidence,
  schistocyteConfidence,
  dysplasiaConfidence,
  safetyProfile,
}) {
  let score =
    erythrocyteConfidence * 0.30 +
    blastConfidence * 0.30 +
    schistocyteConfidence * 0.25 +
    dysplasiaConfidence * 0.15;

  if (
    safetyProfile?.normalPattern &&
    blastConfidence <= 20 &&
    schistocyteConfidence <= 20
  ) {
    score = Math.max(score, 58);
  }

  return normalize(score);
}

// ============================================================================
// QUALITY
// ============================================================================

function classifyQuality(score) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Boa";
  if (score >= 40) return "Moderada";
  return "Baixa";
}

// ============================================================================
// SUMMARY
// ============================================================================

function buildSummary({
  globalConfidenceScore,
  hematologicRisk,
  blastConfidence,
  schistocyteConfidence,
  erythrocyteConfidence,
  plateletConfidence,
  diagnosticCoherenceConfidence,
  safetyProfile,
}) {
  let summary =
    "Análise hematológica processada com confiança hierárquica multi-engine V4.";

  if (safetyProfile?.safeDiagnosticGate === true) {
    summary += " Safety gate liberado.";
  }

  if (safetyProfile?.diagnosticReliability >= 70) {
    summary += " Boa confiabilidade diagnóstica automatizada.";
  }

  if (erythrocyteConfidence >= 55) {
    summary += " Achados eritrocitários com sustentação visual.";
  }

  if (plateletConfidence >= 55) {
    summary += " Avaliação plaquetária com boa sustentação.";
  }

  if (blastConfidence >= 70) {
    summary += " Alta confiança para células imaturas.";
  } else if (blastConfidence <= 20) {
    summary += " Baixa sustentação para suspeita blástica.";
  }

  if (schistocyteConfidence >= 65) {
    summary += " Fragmentação eritrocitária clinicamente relevante.";
  }

  if (diagnosticCoherenceConfidence >= 60) {
    summary += " Correlação diagnóstica integrada consistente.";
  }

  summary += ` Confiança global: ${globalConfidenceScore}%.`;
  summary += ` Classificação: ${hematologicRisk.label}.`;

  return summary;
}

// ============================================================================
// POSITIVE FINDING WITH NEGATION WINDOW
// ============================================================================

function hasPositiveFinding(text = "", terms = []) {
  const normalized = normalizeText(text);

  const negativePatterns = [
    "nao observado",
    "nao observados",
    "nao observada",
    "nao observadas",
    "não observado",
    "não observados",
    "não observada",
    "não observadas",
    "not observed",
    "absent",
    "ausente",
    "sem evidencia",
    "sem evidência",
    "sem suspeita",
    "not assessed",
    "none",
  ];

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);

    if (!normalized.includes(normalizedTerm)) {
      continue;
    }

    const index = normalized.indexOf(normalizedTerm);

    const window = normalized.slice(
      Math.max(0, index - 45),
      index + normalizedTerm.length + 45,
    );

    if (
      negativePatterns.some((negative) =>
        window.includes(normalizeText(negative)),
      )
    ) {
      continue;
    }

    return true;
  }

  return false;
}

function containsAny(text = "", terms = []) {
  const normalized = normalizeText(text);

  return terms.some((term) =>
    normalized.includes(normalizeText(term)),
  );
}

// ============================================================================
// TEXT NORMALIZATION
// ============================================================================

function normalizeText(text = "") {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// ============================================================================
// NORMALIZE SCORE
// ============================================================================

function normalize(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(value) || 0),
    ),
  );
}

// ============================================================================
// QUALITY NORMALIZATION
// ============================================================================

function normalizeQuality(value) {
  if (typeof value === "string") {
    const normalized = normalizeText(value);

    if (normalized.includes("excellent") || normalized.includes("excelente")) {
      return 88;
    }

    if (
      normalized.includes("high") ||
      normalized.includes("alta") ||
      normalized.includes("boa")
    ) {
      return 78;
    }

    if (
      normalized.includes("adequate") ||
      normalized.includes("adequado") ||
      normalized.includes("adequada")
    ) {
      return 70;
    }

    if (
      normalized.includes("moderate") ||
      normalized.includes("moderada")
    ) {
      return 58;
    }

    if (normalized.includes("low") || normalized.includes("baixa")) {
      return 42;
    }

    return 55;
  }

  if (Number(value) <= 5) {
    return normalize(Number(value) * 20);
  }

  return normalize(value);
}

// ============================================================================
// QUALITY ADJUSTMENT
// ============================================================================

function applyQualityAdjustment(
  score,
  qualityScore,
  mode = "standard",
) {
  let factor = qualityScore / 100;

  if (mode === "critical") {
    factor = Math.max(0.45, factor);
  }

  if (mode === "standard") {
    factor = Math.max(0.55, factor);
  }

  return score * factor;
}

// ============================================================================
// WEIGHTED AVERAGE
// ============================================================================

function weightedAverage(
  primary,
  secondary,
  primaryWeight = 0.70,
) {
  return (
    primary * primaryWeight +
    secondary * (1 - primaryWeight)
  );
}

// ============================================================================
// EMPTY
// ============================================================================

function buildEmptyConfidence() {
  return {
    globalConfidenceScore: 0,

    hematologicRisk: {
      level: "unknown",
      score: 0,
      label: "SEM DADOS",
    },

    microscopyQuality: {
      score: 0,
      classification: "Indeterminada",
    },

    confidenceMatrix: {
      blastConfidence: 0,
      schistocyteConfidence: 0,
      erythrocyteConfidence: 0,
      plateletConfidence: 0,
      inflammatoryPatternConfidence: 0,
      dysplasiaConfidence: 0,
      diagnosticCoherenceConfidence: 0,
    },

    confidenceHierarchy: {
      cellLevel: 0,
      morphologyLevel: 0,
      diagnosticLevel: 0,
      global: 0,
    },

    calibration: {
      version: "V4_ENTERPRISE_SAFETY_AWARE",
      strategy: "empty_confidence_result",
    },

    safetySignals: {
      visualEvidenceScore: 0,
      diagnosticReliability: 0,
      morphologyCoherence: 0,
      artifactProbability: 0,
      falsePositiveRisk: 0,
      safeDiagnosticGate: false,
    },

    summary: "Sem informações suficientes para análise.",
  };
}