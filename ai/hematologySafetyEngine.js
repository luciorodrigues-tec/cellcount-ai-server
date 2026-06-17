// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY SAFETY ENGINE V8.3 HOSPITAL CALIBRATED
// SAFE BUT NOT BLIND — SEM LOOP SEMÂNTICO + REAL SCORING
// ============================================================================

export function validateHematologyAnalysis({
  analysis = {},
  extractedText = "",
  erythrocyteAnalysis = {},
  leukocyteAnalysis = {},
  plateletAnalysis = {},
  diagnosticCorrelation = {},
  confidenceAnalysis = {},
  analysisSource = "ai_visual",
}) {
  if (!analysis || typeof analysis !== "object") {
    return {
      valid: false,
      severity: "critical",
      safeDiagnosticGate: false,
      alerts: ["Resultado hematológico ausente."],
      correctedAnalysis: {},
    };
  }

  const safetyAlerts = [];
  const contradictionFlags = [];
  const coherenceAdjustments = [];
  const modifiedFields = [];

  const correctedAnalysis = safeClone(analysis);

  ensureStructure(correctedAnalysis);

  correctedAnalysis.meta = {
    ...(correctedAnalysis.meta || {}),
    analysisSource,
    manualDifferential: analysisSource === "manual",
    visualAnalysis: analysisSource === "ai_visual",
    hybridAnalysis: analysisSource === "hybrid",
  };

  const evidenceProfile = buildEvidenceProfile({
    analysis: correctedAnalysis,
    extractedText,
    erythrocyteAnalysis,
    leukocyteAnalysis,
    plateletAnalysis,
    diagnosticCorrelation,
    confidenceAnalysis,
  });

  const quality = normalizeQuality(
    correctedAnalysis?.microscopyQualityScore?.overall ||
      correctedAnalysis?.visualEvidence?.imageReliability ||
      correctedAnalysis?.imageQuality?.confidence ||
      evidenceProfile.imageQualityLabel ||
      55,
  );

  const blastMorphologySignal = calculateBlastMorphologySignal({
    analysis: correctedAnalysis,
    leukocyteAnalysis,
    evidenceProfile,
  });

  const visualEvidenceScore = calculateVisualEvidenceScore({
    analysis: correctedAnalysis,
    leukocyteAnalysis,
    erythrocyteAnalysis,
    plateletAnalysis,
    diagnosticCorrelation,
    confidenceAnalysis,
    quality,
    blastMorphologySignal,
    evidenceProfile,
  });

  correctedAnalysis.meta.visualEvidenceScore = visualEvidenceScore;

  const artifactProbability = calculateArtifactProbability({
    quality,
    analysis: correctedAnalysis,
    evidenceProfile,
  });

  correctedAnalysis.meta.artifactProbability = artifactProbability;

  const morphologyCoherence = calculateMorphologyCoherence({
    analysis: correctedAnalysis,
    leukocyteAnalysis,
    erythrocyteAnalysis,
    plateletAnalysis,
    diagnosticCorrelation,
    confidenceAnalysis,
    blastMorphologySignal,
    evidenceProfile,
  });

  correctedAnalysis.meta.morphologyCoherence = morphologyCoherence;

  const falsePositiveRisk = calculateFalsePositiveRisk({
    visualEvidenceScore,
    artifactProbability,
    morphologyCoherence,
    quality,
    blastMorphologySignal,
    evidenceProfile,
  });

  correctedAnalysis.meta.falsePositiveRisk = falsePositiveRisk;

  validateBlastConsistency({
    analysis: correctedAnalysis,
    leukocyteAnalysis,
    quality,
    analysisSource,
    visualEvidenceScore,
    morphologyCoherence,
    artifactProbability,
    blastMorphologySignal,
    evidenceProfile,
    safetyAlerts,
    contradictionFlags,
    coherenceAdjustments,
    modifiedFields,
  });

  validateSchistocyteConsistency({
    analysis: correctedAnalysis,
    erythrocyteAnalysis,
    quality,
    evidenceProfile,
    safetyAlerts,
    contradictionFlags,
    modifiedFields,
  });

  validateLeukocyteConsistency({
    analysis: correctedAnalysis,
    leukocyteAnalysis,
    blastMorphologySignal,
    evidenceProfile,
    contradictionFlags,
    modifiedFields,
  });

  validateManualMode({
    analysis: correctedAnalysis,
    analysisSource,
    visualEvidenceScore,
    safetyAlerts,
    contradictionFlags,
    coherenceAdjustments,
    modifiedFields,
  });

  validateHeatmaps({
    analysis: correctedAnalysis,
    safetyAlerts,
    modifiedFields,
  });

  let severity = "low";

  if (safetyAlerts.length >= 3) severity = "moderate";
  if (safetyAlerts.length >= 6) severity = "high";
  if (contradictionFlags.length >= 4) severity = "critical";

  let safeDiagnosticGate = true;

  const strongBlastMorphology =
    blastMorphologySignal.confidence >= 50 &&
    blastMorphologySignal.criteriaCount >= 2;

  const moderateBlastMorphology =
    blastMorphologySignal.confidence >= 35 &&
    blastMorphologySignal.criteriaCount >= 2;

  if (visualEvidenceScore < 40 && !strongBlastMorphology) {
    safeDiagnosticGate = false;
    contradictionFlags.push(
      "Baixa evidência visual global para correlação avançada.",
    );
  }

  if (artifactProbability > 65) {
    safeDiagnosticGate = false;
    contradictionFlags.push(
      "Alta probabilidade de artefatos microscópicos.",
    );
  }

  if (morphologyCoherence < 45 && !moderateBlastMorphology) {
    safeDiagnosticGate = false;
    contradictionFlags.push(
      "Baixa coerência morfológica entre engines.",
    );
  }

  if (analysisSource === "manual") {
    safeDiagnosticGate = false;
  }

  if (!safeDiagnosticGate) {
    applySafetyOverride({
      analysis: correctedAnalysis,
      modifiedFields,
      coherenceAdjustments,
      preserveBlastSuspicion: moderateBlastMorphology,
      blastMorphologySignal,
    });

    safetyAlerts.push(
      moderateBlastMorphology
        ? "Modo seguro ativado preservando suspeita morfológica com revisão humana."
        : "Modo seguro ativado por baixa confiabilidade diagnóstica.",
    );
  }

    const diagnosticReliability = calculateDiagnosticReliability({
      visualEvidenceScore,
      morphologyCoherence,
      artifactProbability,
      quality,
      blastMorphologySignal,
      evidenceProfile,
      confidenceAnalysis,
      analysis: correctedAnalysis,
    });

  correctedAnalysis.meta.diagnosticReliability = diagnosticReliability;
  correctedAnalysis.meta.blastMorphologySignal = blastMorphologySignal;
  correctedAnalysis.meta.evidenceProfile = evidenceProfile.publicSummary;

  return {
    valid: contradictionFlags.length <= 3,
    severity,
    safeDiagnosticGate,
    visualEvidenceScore,
    morphologyCoherence,
    artifactProbability,
    falsePositiveRisk,
    diagnosticReliability,
    blastMorphologySignal,
    alerts: unique(safetyAlerts),
    contradictionFlags: unique(contradictionFlags),
    coherenceAdjustments: unique(coherenceAdjustments),
    correctedAnalysis: {
      modifiedFields: unique(modifiedFields),
      adjustments: unique(coherenceAdjustments),
      meta: correctedAnalysis.meta,
    },
  };
}

// ============================================================================
// EVIDENCE PROFILE
// ============================================================================

function buildEvidenceProfile({
  analysis = {},
  extractedText = "",
  erythrocyteAnalysis = {},
  leukocyteAnalysis = {},
  plateletAnalysis = {},
  diagnosticCorrelation = {},
  confidenceAnalysis = {},
}) {
  const visualExtraction = analysis?.visualExtraction || {};
  const morphologyAnalysis = analysis?.morphologyAnalysis || {};
  const imageQuality = analysis?.imageQuality || {};
  const overallAssessment = analysis?.overallAssessment || {};
  const structuredReport = analysis?.structuredReport || {};
  const erythrocyteFindings = analysis?.erythrocyteFindings || {};
  const leukocyteFindings = analysis?.leukocyteFindings || {};
  const plateletFindings = analysis?.plateletFindings || {};
  const blastSuspicion = analysis?.blastSuspicion || {};

  const visualText = normalizeText(
    [
      JSON.stringify(visualExtraction),
      JSON.stringify(morphologyAnalysis),
      JSON.stringify(erythrocyteFindings),
      JSON.stringify(leukocyteFindings),
      JSON.stringify(plateletFindings),
      JSON.stringify(blastSuspicion),
    ].join(" "),
  );

  const summaryText = normalizeText(
    [
      extractedText,
      JSON.stringify(overallAssessment),
      JSON.stringify(structuredReport),
      JSON.stringify(diagnosticCorrelation),
      JSON.stringify(confidenceAnalysis),
      JSON.stringify(erythrocyteAnalysis),
      JSON.stringify(leukocyteAnalysis),
      JSON.stringify(plateletAnalysis),
    ].join(" "),
  );

  const allText = normalizeText(`${visualText} ${summaryText}`);

  const observedCells = detectObservedCells({
    visualExtraction,
    morphologyAnalysis,
    visualText,
    allText,
  });

  const hasRbcEvidence =
    hasAnyPositiveFinding(morphologyAnalysis?.erythrocytes, [
      "anisocitose",
      "poiquilocitose",
      "policromasia",
      "hipocromia",
      "macrocitose",
      "microcitose",
      "schistocytes",
      "esquizócitos",
      "esquizocitos",
      "acanthocytes",
      "acantócitos",
      "acantocitos",
    ]) ||
    containsAny(allText, [
      "anisopoiquilocitose",
      "anisocitose",
      "poiquilocitose",
      "normociticas",
      "normocíticas",
      "normocromicas",
      "normocrômicas",
      "eritrocitos",
      "eritrócitos",
      "hemacias",
      "hemácias",
      "erythrocytes",
    ]);

  const hasPlateletEvidence =
    hasAnyPositiveFinding(
      morphologyAnalysis?.platelets || morphologyAnalysis?.plaquetas,
      [
        "número",
        "numero",
        "aggregation",
        "agregação",
        "agregacao",
        "giantPlatelets",
        "plaquetas",
      ],
    ) ||
    containsAny(allText, [
      "plaquetas",
      "platelets",
      "agregados plaquetarios",
      "agregados plaquetários",
    ]);

  const hasLeukocyteEvidence =
    observedCells.neutrophils ||
    observedCells.lymphocytes ||
    observedCells.leukocytes ||
    containsAny(allText, [
      "neutrofilos",
      "neutrófilos",
      "linfocitos",
      "linfócitos",
      "leucocitos",
      "leucócitos",
      "serie branca",
      "série branca",
    ]);

  const hasAbnormalMorphology =
    containsAny(allText, [
      "anisopoiquilocitose",
      "poiquilocitose",
      "anisocitose",
      "hipocromia",
      "policromasia",
      "esquizocito",
      "esquizócito",
      "blast",
      "blasto",
      "imaturidade",
      "cromatina fina",
      "nucleolo",
      "nucléolo",
      "displasia",
      "desvio a esquerda",
      "desvio à esquerda",
      "agregados",
    ]) &&
    !containsAnyNearNegative(allText, [
      "blast",
      "blasto",
      "imaturidade",
      "displasia",
      "esquizocito",
      "esquizócito",
    ]);

  const limitedField =
    analysis?.finalClassification ===
      "CLASS_1_LIMITED_FIELD" ||
    analysis?.normalityBlocked === true;

  const normalPattern =
    !limitedField &&
    containsAny(allText, [
      "sem alteracoes",
      "sem alterações",
      "morfologia normal",
      "sem evidencia",
      "sem evidência",
      "sem sustentacao",
      "sem sustentação",
      "normal pattern",
    ]);

  const qualityLabel = normalizeText(JSON.stringify(imageQuality));

  return {
    visualText,
    summaryText,
    allText,
    observedCells,
    hasRbcEvidence,
    hasPlateletEvidence,
    hasLeukocyteEvidence,
    hasAbnormalMorphology,
    normalPattern,
    imageQualityLabel: qualityLabel,
    publicSummary: {
      hasRbcEvidence,
      hasPlateletEvidence,
      hasLeukocyteEvidence,
      hasAbnormalMorphology,
      normalPattern,
      observedCells,
    },
  };
}

function detectObservedCells({
  visualExtraction = {},
  morphologyAnalysis = {},
  visualText = "",
  allText = "",
}) {
  const observedCells = {
    erythrocytes: false,
    leukocytes: false,
    neutrophils: false,
    lymphocytes: false,
    monocytes: false,
    eosinophils: false,
    basophils: false,
    platelets: false,
  };

  const combined = normalizeText(
    `${visualText} ${JSON.stringify(visualExtraction)} ${JSON.stringify(morphologyAnalysis)} ${allText}`,
  );

  observedCells.erythrocytes = containsAny(combined, [
    "eritrocitos",
    "eritrócitos",
    "hemacias",
    "hemácias",
    "erythrocytes",
    "rbc",
  ]);

  observedCells.leukocytes = containsAny(combined, [
    "leucocitos",
    "leucócitos",
    "leukocytes",
    "serie branca",
    "série branca",
  ]);

  observedCells.neutrophils = containsAny(combined, [
    "neutrofilos",
    "neutrófilos",
    "neutrophils",
    "segmentados",
    "segmentado",
  ]);

  observedCells.lymphocytes = containsAny(combined, [
    "linfocitos",
    "linfócitos",
    "lymphocytes",
    "linfocito",
    "linfócito",
  ]);

  observedCells.monocytes = containsAny(combined, [
    "monocitos",
    "monócitos",
    "monocytes",
  ]);

  observedCells.eosinophils = containsAny(combined, [
    "eosinofilos",
    "eosinófilos",
    "eosinophils",
  ]);

  observedCells.basophils = containsAny(combined, [
    "basofilos",
    "basófilos",
    "basophils",
  ]);

  observedCells.platelets = containsAny(combined, [
    "plaquetas",
    "platelets",
    "plaquetario",
    "plaquetário",
  ]);

  if (
    observedCells.neutrophils ||
    observedCells.lymphocytes ||
    observedCells.monocytes ||
    observedCells.eosinophils ||
    observedCells.basophils
  ) {
    observedCells.leukocytes = true;
  }

  return observedCells;
}

// ============================================================================
// BLAST MORPHOLOGY SIGNAL — SEM LOOP SEMÂNTICO
// ============================================================================

function calculateBlastMorphologySignal({
  analysis = {},
  leukocyteAnalysis = {},
  evidenceProfile = {},
}) {
  const visualExtraction = analysis?.visualExtraction || {};
  const morphologyAnalysis = analysis?.morphologyAnalysis || {};
  const leukocyteFindings = analysis?.leukocyteFindings || {};
  const blastSuspicion = analysis?.blastSuspicion || {};

  const blastPositive =
    hasPositiveValue(visualExtraction, [
      "blastosSuspeitos",
      "blastos suspeitos",
      "suspectedBlasts",
      "suspected blasts",
      "blasts",
      "blastos",
    ]) ||
    hasPositiveValue(leukocyteFindings, [
      "blastosSuspeitos",
      "blastos suspeitos",
      "suspectedBlasts",
      "suspected blasts",
      "blasts",
      "blastos",
    ]) ||
    hasPositiveValue(
      blastSuspicion,
      ["present", "presente", "level", "nivel", "nível"],
      ["moderate", "moderada", "high", "alta", "present", "presente"],
    );

  const immaturePositive =
    hasPositiveValue(visualExtraction, [
      "célulasImaturas",
      "celulasImaturas",
      "células imaturas",
      "celulas imaturas",
      "immatureCells",
      "immature cells",
    ]) ||
    hasPositiveValue(leukocyteFindings, [
      "célulasImaturas",
      "celulasImaturas",
      "células imaturas",
      "celulas imaturas",
      "immatureCells",
      "immature cells",
    ]);

  const leukocyteMorphology =
    morphologyAnalysis?.leucócitos ||
    morphologyAnalysis?.leucocitos ||
    morphologyAnalysis?.leukocytes ||
    {};

  const nucleoliPositive = hasPositiveValue(leukocyteMorphology, [
    "nucléolos",
    "nucleolos",
    "nucleoli",
    "nucleolus",
  ]);

  const fineChromatinPositive = hasPositiveValue(
    leukocyteMorphology,
    ["cromatina", "chromatin"],
    ["fine", "fina", "frouxa", "open", "delicate"],
  );

  const highNCPositive = hasPositiveValue(
    leukocyteMorphology,
    [
      "relação núcleo/citoplasma",
      "relacao nucleo citoplasma",
      "relaçãoNucleoCitoplasma",
      "nucleusCytoplasmRatio",
      "nucleus cytoplasm ratio",
    ],
    ["increased", "aumentada", "elevada", "alta", "high"],
  );

  const absentSegmentationPositive = hasPositiveValue(
    leukocyteMorphology,
    ["segmentação", "segmentacao", "segmentation"],
    ["ausente", "absent", "sem segmentacao", "sem segmentação"],
  );

  const criteria = {
    suspectedBlast: blastPositive,
    immatureCells: immaturePositive,
    nucleoli: nucleoliPositive,
    fineChromatin: fineChromatinPositive,
    highNC: highNCPositive,
    absentSegmentation: absentSegmentationPositive,
  };

  const criteriaCount = Object.values(criteria).filter(Boolean).length;

  let confidence = 0;

  if (criteria.suspectedBlast) confidence += 14;
  if (criteria.immatureCells) confidence += 16;
  if (criteria.nucleoli) confidence += 18;
  if (criteria.fineChromatin) confidence += 18;
  if (criteria.highNC) confidence += 18;
  if (criteria.absentSegmentation) confidence += 8;

  if (criteriaCount >= 3) confidence += 10;
  if (criteriaCount >= 4) confidence += 12;

  if (evidenceProfile?.normalPattern && criteriaCount < 3) {
    confidence -= 20;
  }

  if (criteria.suspectedBlast && criteriaCount < 2) {
    confidence -= 18;
  }

  if (
    !criteria.highNC &&
    !criteria.fineChromatin &&
    !criteria.nucleoli &&
    !criteria.immatureCells
  ) {
    confidence = Math.min(confidence, 18);
  }

  confidence = normalize(confidence);

  return {
    present: confidence >= 35 && criteriaCount >= 2,
    confidence,
    criteria,
    criteriaCount,
    level:
      confidence >= 70
        ? "high"
        : confidence >= 50
          ? "moderate"
          : confidence >= 35
            ? "minimal"
            : "low",
  };
}

// ============================================================================
// VISUAL EVIDENCE SCORE
// ============================================================================

function calculateVisualEvidenceScore({
  analysis = {},
  leukocyteAnalysis = {},
  erythrocyteAnalysis = {},
  plateletAnalysis = {},
  diagnosticCorrelation = {},
  confidenceAnalysis = {},
  quality = 55,
  blastMorphologySignal = {},
  evidenceProfile = {},
}) {
  let score = 0;

  const pipelineEvidence =
    Number(analysis?.visualEvidence?.visualEvidenceScore || 0);

  if (pipelineEvidence > 0) {
    score = Math.max(score, pipelineEvidence);
  }

  const heatmaps = analysis?.heatmapRegions || [];

  if (Array.isArray(heatmaps) && heatmaps.length > 0) score += 10;

  const visualExtraction = analysis?.visualExtraction || {};

  if (Object.keys(visualExtraction).length > 0) score += 12;

  const morphologyAnalysis = analysis?.morphologyAnalysis || {};

  if (Object.keys(morphologyAnalysis).length > 0) score += 10;

  if (evidenceProfile.hasRbcEvidence) score += 10;
  if (evidenceProfile.hasLeukocyteEvidence) score += 10;
  if (evidenceProfile.hasPlateletEvidence) score += 8;
  if (evidenceProfile.hasAbnormalMorphology) score += 8;

  const leukocyteMorphology =
    analysis?.morphologyAnalysis?.leukocytes ||
    analysis?.morphologyAnalysis?.leucócitos ||
    analysis?.morphologyAnalysis?.leucocitos ||
    {};

  if (Object.keys(leukocyteMorphology).length > 0) score += 8;

  const leukocytes = leukocyteAnalysis?.leukocyteFindings || [];

  if (Array.isArray(leukocytes) && leukocytes.length > 0) score += 10;

  if (leukocyteAnalysis?.immatureFeaturesDetected) score += 8;

  const dominantRBC = erythrocyteAnalysis?.dominantMorphology || "";

  if (dominantRBC && dominantRBC !== "normal_pattern") score += 7;

  const plateletPattern =
    plateletAnalysis?.dominantPattern ||
    plateletAnalysis?.dominantPlateletPattern ||
    "";

  if (plateletPattern && plateletPattern !== "normal_platelet_pattern") {
    score += 5;
  }

  if (blastMorphologySignal?.present) {
    score += Math.min(16, blastMorphologySignal.confidence * 0.22);
  }

  const globalConfidence =
    Number(confidenceAnalysis?.globalConfidenceScore || 0);

  if (globalConfidence > 0) {
    score += Math.min(8, globalConfidence * 0.15);
  }

  score += quality * 0.12;

  if (
    evidenceProfile.hasRbcEvidence ||
    evidenceProfile.hasLeukocyteEvidence ||
    evidenceProfile.hasPlateletEvidence
  ) {
    score = Math.max(score, 58);
  }

  if (evidenceProfile.hasAbnormalMorphology) {
    score = Math.max(score, 64);
  }

  if (pipelineEvidence > 0) {
    score = Math.max(score, pipelineEvidence);
  }

  return normalize(score);
}

// ============================================================================
// ARTIFACT PROBABILITY
// ============================================================================

function calculateArtifactProbability({
  quality = 55,
  analysis = {},
  evidenceProfile = {},
}) {
  let probability = 0;

  if (quality < 70) probability += 15;
  if (quality < 50) probability += 20;
  if (quality < 35) probability += 30;

  const imageQualityText = normalizeText(
    JSON.stringify(analysis?.imageQuality || {}),
  );

  if (
    imageQualityText.includes("minimal") ||
    imageQualityText.includes("minimo") ||
    imageQualityText.includes("mínimo") ||
    imageQualityText.includes("baixo") ||
    imageQualityText.includes("low") ||
    imageQualityText.includes("adequado") ||
    imageQualityText.includes("adequate")
  ) {
    probability -= 8;
  }

  if (
    imageQualityText.includes("artifact") ||
    imageQualityText.includes("artefato") ||
    imageQualityText.includes("poor focus") ||
    imageQualityText.includes("desfocado")
  ) {
    probability += 12;
  }

  if (
    evidenceProfile.hasRbcEvidence ||
    evidenceProfile.hasLeukocyteEvidence ||
    evidenceProfile.hasPlateletEvidence
  ) {
    probability -= 5;
  }

  return normalize(probability);
}

// ============================================================================
// MORPHOLOGY COHERENCE
// ============================================================================

function calculateMorphologyCoherence({
  analysis = {},
  leukocyteAnalysis = {},
  erythrocyteAnalysis = {},
  plateletAnalysis = {},
  diagnosticCorrelation = {},
  confidenceAnalysis = {},
  blastMorphologySignal = {},
  evidenceProfile = {},
}) {
  let score = 72;

  const blastRisk = leukocyteAnalysis?.blastRisk || "";
  const immature = leukocyteAnalysis?.immatureFeaturesDetected;

  if (blastRisk === "high" && !immature && !blastMorphologySignal.present) {
    score -= 25;
  }

  if (
    blastMorphologySignal.present &&
    blastMorphologySignal.criteriaCount >= 2
  ) {
    score += 10;
  }

  const dominantRBC = erythrocyteAnalysis?.dominantMorphology || "";

  if (dominantRBC === "artifact") score -= 35;

  if (evidenceProfile.hasRbcEvidence) score += 7;
  if (evidenceProfile.hasLeukocyteEvidence) score += 7;
  if (evidenceProfile.hasPlateletEvidence) score += 6;

  if (evidenceProfile.normalPattern && !blastMorphologySignal.present) {
    score += 8;
  }

  const diagnosticFindings = diagnosticCorrelation?.findings || [];

  if (Array.isArray(diagnosticFindings) && diagnosticFindings.length > 0) {
    score += 5;
  }

  const globalConfidence =
    Number(confidenceAnalysis?.globalConfidenceScore || 0);

  if (globalConfidence >= 50) score += 5;

  return normalize(score);
}

// ============================================================================
// FALSE POSITIVE RISK
// ============================================================================

function calculateFalsePositiveRisk({
  visualEvidenceScore = 0,
  artifactProbability = 0,
  morphologyCoherence = 100,
  quality = 55,
  blastMorphologySignal = {},
  evidenceProfile = {},
}) {
  let risk =
    (
      (100 - visualEvidenceScore) +
      artifactProbability +
      (100 - morphologyCoherence) +
      (100 - quality)
    ) / 4;

  if (blastMorphologySignal?.present) {
    risk -= Math.min(18, blastMorphologySignal.confidence * 0.22);
  }

  if (evidenceProfile.normalPattern && !blastMorphologySignal?.present) {
    risk -= 6;
  }

  if (
    evidenceProfile.hasRbcEvidence ||
    evidenceProfile.hasLeukocyteEvidence ||
    evidenceProfile.hasPlateletEvidence
  ) {
    risk -= 5;
  }

  return normalize(risk);
}

// ============================================================================
// DIAGNOSTIC RELIABILITY
// ============================================================================

function calculateDiagnosticReliability({
  visualEvidenceScore = 0,
  morphologyCoherence = 100,
  artifactProbability = 0,
  quality = 55,
  blastMorphologySignal = {},
  evidenceProfile = {},
  confidenceAnalysis = {},
  analysis = {},
}) {

  let score =
    (
      visualEvidenceScore +
      morphologyCoherence +
      (100 - artifactProbability) +
      quality +
      Math.min(blastMorphologySignal.confidence || 0, 70)
    ) / 5;

  if (evidenceProfile.hasRbcEvidence && evidenceProfile.hasPlateletEvidence) {
    score += 4;
  }

  if (evidenceProfile.hasLeukocyteEvidence) score += 4;

  const globalConfidence =
    Number(confidenceAnalysis?.globalConfidenceScore || 0);

  if (globalConfidence >= 50) score += 5;

    const findings =
      analysis?.findings || {};

    if (
      findings.monomorphicPopulation ||
      findings.largeMononuclearCells ||
      findings.atypicalLymphocytes ||
      findings.reactiveLymphocytes ||
      findings.plasmacytoidCells ||
      findings.plasmocytes ||
      findings.plasmablasts
    ) {
      score += 15;
    }

  return normalize(score);
}

// ============================================================================
// SAFETY OVERRIDE
// ============================================================================

function applySafetyOverride({
  analysis = {},
  modifiedFields = [],
  coherenceAdjustments = [],
  preserveBlastSuspicion = false,
  blastMorphologySignal = {},
}) {
  if (analysis?.overallAssessment) {
    analysis.overallAssessment.riskCategory =
      preserveBlastSuspicion ? "morphologic_review" : "inconclusive";

    analysis.overallAssessment.requiresHumanReview = true;
    analysis.overallAssessment.safeMode = true;

    modifiedFields.push("overallAssessment.riskCategory");
    modifiedFields.push("overallAssessment.requiresHumanReview");
  }

  if (analysis?.blastSuspicion) {
    if (preserveBlastSuspicion) {
      analysis.blastSuspicion.present = true;
      analysis.blastSuspicion.confidence =
        blastMorphologySignal.confidence || 0;

      analysis.blastSuspicion.validation = "required";

      analysis.blastSuspicion.safeInterpretation =
        "Suspeita morfológica preservada; revisão hematológica obrigatória.";

      modifiedFields.push("blastSuspicion.present");
      modifiedFields.push("blastSuspicion.confidence");
      modifiedFields.push("blastSuspicion.safeInterpretation");
    } else {
      analysis.blastSuspicion.present = false;
      analysis.blastSuspicion.confidence = 0;

      modifiedFields.push("blastSuspicion.present");
      modifiedFields.push("blastSuspicion.confidence");
    }
  }

  coherenceAdjustments.push(
    preserveBlastSuspicion
      ? "Modo seguro aplicado preservando suspeita blástica morfológica."
      : "Classificação reduzida para modo inconclusivo seguro.",
  );
}

// ============================================================================
// BLAST VALIDATION
// ============================================================================

function validateBlastConsistency({
  analysis = {},
  leukocyteAnalysis = {},
  quality = 55,
  analysisSource = "ai_visual",
  visualEvidenceScore = 0,
  morphologyCoherence = 100,
  artifactProbability = 0,
  blastMorphologySignal = {},
  evidenceProfile = {},
  safetyAlerts = [],
  contradictionFlags = [],
  coherenceAdjustments = [],
  modifiedFields = [],
}) {
  const blastAssessment =
    analysis?.morphologicConfidenceMatrix?.blastAssessment || {};

  let confidence = Number(blastAssessment?.confidence || 0);

  if (blastMorphologySignal?.confidence > 0) {
    confidence = Math.max(confidence, blastMorphologySignal.confidence);
  }

  if (visualEvidenceScore < 45 && !blastMorphologySignal.present) {
    confidence *= 0.45;
    contradictionFlags.push(
      "Blast confidence reduzido por baixa evidência visual global.",
    );
  }

  if (morphologyCoherence < 55 && !blastMorphologySignal.present) {
    confidence *= 0.60;
    contradictionFlags.push(
      "Blast confidence reduzido por incoerência morfológica.",
    );
  }

  if (artifactProbability > 65) {
    confidence *= 0.50;
    contradictionFlags.push(
      "Blast confidence reduzido por artefatos microscópicos.",
    );
  }

  if (quality < 45) {
    confidence *= 0.75;
    safetyAlerts.push(
      "Baixa qualidade microscópica reduz confiabilidade blástica.",
    );
  }

  if (analysisSource === "manual") {
    confidence *= 0.40;
    safetyAlerts.push("Modo manual reduz confiabilidade proliferativa.");
  }

  if (
    evidenceProfile.normalPattern &&
    analysis?.finalClassification !==
      "CLASS_1_LIMITED_FIELD" &&
    !blastMorphologySignal.present
  ) {
    confidence = Math.min(confidence, 12);
  }

  blastAssessment.confidence = normalize(confidence);

  if (blastAssessment.confidence >= 35) {
    blastAssessment.present = true;
    blastAssessment.requiresHumanReview = true;
  } else {
    blastAssessment.present = false;
  }

  modifiedFields.push("blastAssessment.confidence");
  coherenceAdjustments.push(
    "Blast confidence recalibrado pelo safety engine V8.3.",
  );
}

// ============================================================================
// SCHISTOCYTES
// ============================================================================

function validateSchistocyteConsistency({
  analysis = {},
  erythrocyteAnalysis = {},
  quality = 55,
  evidenceProfile = {},
  safetyAlerts = [],
  contradictionFlags = [],
  modifiedFields = [],
}) {
  const schistocyteAssessment =
    analysis?.morphologicConfidenceMatrix?.schistocyteAssessment || {};

  let confidence = Number(schistocyteAssessment?.confidence || 0);

  const dominantRBC = erythrocyteAnalysis?.dominantMorphology || "";

  if (dominantRBC === "acanthocyte" && confidence > 45) {
    confidence *= 0.65;
    contradictionFlags.push(
      "Acantócitos simulando fragmentação eritrocitária.",
    );
  }

  if (quality < 45) {
    confidence *= 0.70;
    safetyAlerts.push("Baixa qualidade reduz confiança para esquizócitos.");
  }

  if (
    evidenceProfile.normalPattern &&
    !containsAny(evidenceProfile.allText || "", [
      "esquizocito",
      "esquizócito",
      "schistocyte",
    ])
  ) {
    confidence = Math.min(confidence, 10);
  }

  schistocyteAssessment.confidence = normalize(confidence);
  modifiedFields.push("schistocyteAssessment.confidence");
}

// ============================================================================
// LEUKOCYTES
// ============================================================================

function validateLeukocyteConsistency({
  analysis = {},
  leukocyteAnalysis = {},
  blastMorphologySignal = {},
  evidenceProfile = {},
  contradictionFlags = [],
  modifiedFields = [],
}) {
  const findings = leukocyteAnalysis?.leukocyteFindings || [];
  const visualExtraction = analysis?.visualExtraction || {};

  const visualBlast = hasPositiveValue(visualExtraction, [
    "blastosSuspeitos",
    "blastos suspeitos",
    "suspectedBlasts",
    "suspected blasts",
  ]);

  const hasVisualLeukocyteEvidence =
    evidenceProfile?.hasLeukocyteEvidence ||
    evidenceProfile?.observedCells?.leukocytes ||
    evidenceProfile?.observedCells?.neutrophils ||
    evidenceProfile?.observedCells?.lymphocytes;

  if (
    Array.isArray(findings) &&
    findings.length === 0 &&
    !blastMorphologySignal.present &&
    !visualBlast &&
    !hasVisualLeukocyteEvidence
  ) {
    leukocyteAnalysis.blastRisk = "indeterminate";
    leukocyteAnalysis.primaryPattern = "non_evaluable";

    modifiedFields.push("leukocyteAnalysis.primaryPattern");
    contradictionFlags.push("Ausência de leucócitos detectáveis.");
  }

  if (blastMorphologySignal.present || visualBlast) {
    leukocyteAnalysis.blastRisk =
      blastMorphologySignal.confidence >= 50 ? "moderate" : "minimal";

    leukocyteAnalysis.immatureFeaturesDetected = true;

    modifiedFields.push("leukocyteAnalysis.blastRisk");
    modifiedFields.push("leukocyteAnalysis.immatureFeaturesDetected");
  }
}

// ============================================================================
// MANUAL MODE
// ============================================================================

function validateManualMode({
  analysis = {},
  analysisSource = "ai_visual",
  visualEvidenceScore = 0,
  safetyAlerts = [],
  contradictionFlags = [],
  coherenceAdjustments = [],
  modifiedFields = [],
}) {
  if (analysisSource !== "manual") return;

  analysis.manualSafetyMode = true;

  modifiedFields.push("manualSafetyMode");

  if (visualEvidenceScore < 60) {
    contradictionFlags.push("Contagem manual sem suporte visual suficiente.");
  }

  safetyAlerts.push("Contagem manual requer revisão microscópica.");
  coherenceAdjustments.push("Modo manual seguro ativado.");
}

// ============================================================================
// HEATMAPS
// ============================================================================

function validateHeatmaps({
  analysis = {},
  safetyAlerts = [],
  modifiedFields = [],
}) {
  const heatmaps = Array.isArray(analysis?.heatmapRegions)
    ? analysis.heatmapRegions
    : [];

  const safeHeatmaps = heatmaps
    .filter(
      (region) =>
        region &&
        typeof region === "object" &&
        !Array.isArray(region),
    )
    .map((region) => {
      const safeRegion = { ...region };

      safeRegion.x =
        Number.isFinite(Number(safeRegion.x))
          ? Number(safeRegion.x)
          : 0;

      safeRegion.y =
        Number.isFinite(Number(safeRegion.y))
          ? Number(safeRegion.y)
          : 0;

      safeRegion.width =
        Number.isFinite(Number(safeRegion.width))
          ? Number(safeRegion.width)
          : 40;

      safeRegion.height =
        Number.isFinite(Number(safeRegion.height))
          ? Number(safeRegion.height)
          : 40;

      safeRegion.confidence =
        normalize(safeRegion.confidence || 0);

      return safeRegion;
    });

  analysis.heatmapRegions = safeHeatmaps;

  modifiedFields.push("heatmapRegions");

  for (const region of safeHeatmaps) {
    if (region.width <= 0 || region.height <= 0) {
      safetyAlerts.push("Heatmap inválido detectado.");
    }
  }
}
// ============================================================================
// STRUCTURE
// ============================================================================

function ensureStructure(analysis = {}) {
  if (!analysis.counts) analysis.counts = {};

  if (!analysis.morphologicConfidenceMatrix) {
    analysis.morphologicConfidenceMatrix = {};
  }

  const matrix = analysis.morphologicConfidenceMatrix;

  if (!matrix.blastAssessment) matrix.blastAssessment = {};
  if (!matrix.schistocyteAssessment) matrix.schistocyteAssessment = {};

  if (!analysis.heatmapRegions) analysis.heatmapRegions = [];
  if (!analysis.overallAssessment) analysis.overallAssessment = {};
  if (!analysis.blastSuspicion) analysis.blastSuspicion = {};
  if (!analysis.meta) analysis.meta = {};
}

// ============================================================================
// VALUE DETECTION HELPERS
// ============================================================================

function hasAnyPositiveFinding(obj = {}, keys = []) {
  return keys.some((key) => hasPositiveValue(obj, [key]));
}

function hasPositiveValue(obj = {}, keys = [], positiveWords = null) {
  const foundValues = [];

  collectValuesByKeys(obj, keys, foundValues);

  for (const value of foundValues) {
    const normalized = normalizeText(value);

    if (isNegativeValue(normalized)) continue;

    if (!positiveWords) {
      if (isPositiveValue(normalized)) return true;
    } else {
      if (
        positiveWords.some((word) =>
          normalized.includes(normalizeText(word)),
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function collectValuesByKeys(obj = {}, keys = [], output = []) {
  if (!obj || typeof obj !== "object") return;

  const normalizedKeys = keys.map(normalizeText);

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeText(key);

    if (normalizedKeys.some((k) => normalizedKey.includes(k))) {
      output.push(value);
    }

    if (value && typeof value === "object") {
      collectValuesByKeys(value, keys, output);
    }
  }
}

function isPositiveValue(value = "") {
  const text = normalizeText(value);

  if (isNegativeValue(text)) return false;

  return (
    text.includes("present") ||
    text.includes("presente") ||
    text.includes("observado") ||
    text.includes("observada") ||
    text.includes("aumentado") ||
    text.includes("aumentada") ||
    text.includes("increased") ||
    text.includes("fine") ||
    text.includes("fina") ||
    text.includes("prominent") ||
    text.includes("proeminente") ||
    text.includes("moderate") ||
    text.includes("moderada") ||
    text.includes("high") ||
    text.includes("alta")
  );
}

function isNegativeValue(value = "") {
  const text = normalizeText(value);

  return (
    text.includes("nao observado") ||
    text.includes("nao observada") ||
    text.includes("não observado") ||
    text.includes("não observada") ||
    text.includes("not observed") ||
    text.includes("not assessed") ||
    text.includes("absent") ||
    text.includes("ausente") ||
    text.includes("none") ||
    text.includes("sem evidencia") ||
    text.includes("sem evidência") ||
    text.includes("sem suspeita") ||
    text.includes("nao detectado") ||
    text.includes("não detectado")
  );
}

function containsAnyNearNegative(text = "", terms = []) {
  const normalized = normalizeText(text);

  for (const term of terms) {
    const t = normalizeText(term);
    const index = normalized.indexOf(t);

    if (index < 0) continue;

    const window = normalized.slice(
      Math.max(0, index - 45),
      index + t.length + 45,
    );

    if (isNegativeValue(window)) return true;
  }

  return false;
}

// ============================================================================
// GENERIC HELPERS
// ============================================================================

function containsAny(text, terms = []) {
  const normalized = normalizeText(text);

  return terms.some((term) =>
    normalized.includes(normalizeText(term)),
  );
}

function normalize(value) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(Number(value) || 0),
    ),
  );
}

function normalizeQuality(value) {
  if (typeof value === "string") {
    const normalized = normalizeText(value);

    if (
      normalized.includes("excellent") ||
      normalized.includes("excelente")
    ) {
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

    if (
      normalized.includes("low") ||
      normalized.includes("baixa")
    ) {
      return 42;
    }

    return 55;
  }

  if (Number(value) <= 5) return normalize(Number(value) * 20);

  return normalize(value);
}

function normalizeText(text = "") {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function unique(arr = []) {
  return [...new Set(arr)];
}

function safeClone(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value || {}));
  }
}