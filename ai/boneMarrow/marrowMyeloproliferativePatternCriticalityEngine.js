// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.49 — MARROW MYELOPROLIFERATIVE PATTERN CORRELATION
//                 & SEVERITY-CRITICALITY CALIBRATION
//
// Core principle:
//   specimen adequacy / representativity calibrates confidence and scope;
//   it must NOT automatically downgrade the clinical criticality of a
//   directly observed, high-salience positive marrow morphology.
//
// This engine is morphology/correlation only.
// It does NOT diagnose CML or any myeloproliferative neoplasm.
// BCR::ABL1 is suggested only as a conditional confirmatory investigation
// when the morphologic pattern is sufficiently high-salience and the
// clinical/laboratory context is concordant.
// ============================================================================

export const MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION =
  "BE-FIX-005.49";

export const MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION =
  "BE-FIX-005.49";

export const MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION =
  "BE-FIX-005.49";

export const MARROW_BCR_ABL1_RECOMMENDATION_GATE_VERSION =
  "BE-FIX-005.49";

export const MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION =
  "BE-FIX-005.50.1";

export const MARROW_TERMINAL_CRITICALITY_CORE_SIGNATURE_VERSION =
  "BE-FIX-005.50.2";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function bool(value) {
  return value === true;
}

function clamp(value, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
}

function appendSentence(existing, sentence) {
  const left = String(existing || "").trim();
  const right = String(sentence || "").trim();

  if (!right) return left;
  if (!left) return right;
  if (left.toLowerCase().includes(right.toLowerCase())) return left;

  return `${left} ${right}`.trim();
}

function readStructuredBlastAuthority(result = {}) {
  const authority = obj(result.finalMarrowAuthority);
  const blast = obj(authority.structuredBlast);
  const population = obj(result.marrowBlastPopulationEvidence);
  const precursor = obj(result.marrowPrecursorDiscrimination);

  const observed =
    blast.observed === true ||
    population.observedPopulation === true ||
    precursor.protectedObservedBlastoid === true;

  const suspicious =
    observed ||
    blast.suspicious === true ||
    population.suspiciousPopulation === true ||
    precursor.protectedSuspiciousBlastoid === true;

  return {
    observed,
    suspicious,
    structured:
      blast.structured === true ||
      population.structuredPathologicSubset === true ||
      precursor.structuredPathologicSubset === true,
  };
}

function severityClass(score) {
  if (score >= 85) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 55) return "MODERATE";
  return "LOW";
}

function severityLabel(level) {
  switch (level) {
    case "CRITICAL":
      return "CRITICIDADE MORFOLÓGICA MUITO ALTA";
    case "HIGH":
      return "ALTA CRITICIDADE MORFOLÓGICA";
    case "MODERATE":
      return "CRITICIDADE MORFOLÓGICA MODERADA";
    default:
      return "BAIXA CRITICIDADE MORFOLÓGICA";
  }
}

function severityRiskLevel(level) {
  switch (level) {
    case "CRITICAL":
      return "CRITICIDADE MUITO ALTA — expansão mieloide/granulocítica acentuada com maturação";
    case "HIGH":
      return "ALTA CRITICIDADE — expansão mieloide/granulocítica relevante com maturação";
    case "MODERATE":
      return "CRITICIDADE MODERADA — expansão mieloide/granulocítica com maturação";
    default:
      return "Expansão mieloide/granulocítica com maturação";
  }
}

export function evaluateMarrowMyeloproliferativePatternCriticality(
  result = {},
) {
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const lock = obj(result.marrowPathologicMaturationContinuumLock);
  const signals = obj(expansion.expansionSignals);
  const blast = readStructuredBlastAuthority(result);

  const protectedExpansion =
    (
      expansion.classification ===
        "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
      result.finalClassification ===
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
      result.morphologicRiskClass ===
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN"
    ) &&
    (
      expansion.pathologicMyeloidExpansionSupported === true ||
      lock.active === true ||
      result.finalMarrowAuthority?.protectedExpansion === true
    );

  const expansionScore = clamp(expansion.expansionScore, 0, 9);

  // Weighted severity is intentionally independent from image adequacy.
  // The score reflects POSITIVE morphology that has already passed the
  // 005.38–005.47 provenance and blast-architecture gates.
  let score = protectedExpansion ? 30 : 0;
  score += expansionScore * 5;
  score += expansion.disproportionateAxis === true ? 5 : 0;
  score += expansion.expansionBurdenAxis === true ? 5 : 0;
  score += bool(signals.leftShiftedMaturationSpectrum) ? 4 : 0;
  score += bool(signals.denseMyeloidField) ? 4 : 0;
  score += bool(signals.erythroidRelativeReduction) ? 3 : 0;
  score += bool(signals.basophilEosinophilEnrichment) ? 4 : 0;
  score = clamp(score);

  let level = protectedExpansion ? severityClass(score) : "LOW";

  const myeloproliferativeSignalCount = [
    signals.relativeMyeloidPredominance,
    signals.disproportionateMyeloidRepresentation,
    signals.numerousGranulocyticPrecursors,
    signals.leftShiftedMaturationSpectrum,
    signals.denseMyeloidField,
    signals.erythroidRelativeReduction,
    signals.basophilEosinophilEnrichment,
  ].filter((value) => value === true).length;

  const myeloproliferativePatternSupported =
    protectedExpansion &&
    !blast.suspicious &&
    expansion.maturationAxis === true &&
    myeloproliferativeSignalCount >= 4 &&
    score >= 70;

  // BE-FIX-005.50.1 — high-salience morphology lock. This is deliberately
  // NOT a generic numeric threshold. A HIGH score is promoted to CRITICAL
  // only when a dense, disproportionate, left-shifted expansion with a broad
  // maturation spectrum has independently survived the marrow authority and
  // blast-architecture gates. Limited field and low diagnostic confidence do
  // not downgrade a directly observed positive morphology.
  // BE-FIX-005.50.2 — high-salience CORE morphology is decisive.
  // Erythroid reduction / basophil-eosinophil enrichment remain supportive,
  // not mandatory. This is NOT a generic score-only promotion.
  const highSalienceCriticalSignature =
    protectedExpansion &&
    !blast.suspicious &&
    expansionScore >= 8 &&
    expansion.disproportionateAxis === true &&
    expansion.expansionBurdenAxis === true &&
    expansion.maturationAxis === true &&
    bool(signals.relativeMyeloidPredominance) &&
    bool(signals.disproportionateMyeloidRepresentation) &&
    bool(signals.numerousGranulocyticPrecursors) &&
    bool(signals.broadMaturationSpectrum) &&
    bool(signals.matureFormsPresent) &&
    bool(signals.leftShiftedMaturationSpectrum) &&
    bool(signals.denseMyeloidField);

  const highSalienceSupportiveModifiers = [
    signals.erythroidRelativeReduction,
    signals.basophilEosinophilEnrichment,
  ].filter((value) => value === true).length;

  if (level === "HIGH" && highSalienceCriticalSignature) {
    level = "CRITICAL";
  }

  // Do not order a molecular test from morphology alone. Instead expose a
  // conditional gate that becomes actionable when CBC/differential and the
  // clinical context corroborate the proliferative pattern.
  const bcrAbl1ContextGate =
    myeloproliferativePatternSupported &&
    (
      level === "CRITICAL" ||
      (
        level === "HIGH" &&
        bool(signals.leftShiftedMaturationSpectrum) &&
        (
          bool(signals.basophilEosinophilEnrichment) ||
          bool(signals.numerousGranulocyticPrecursors)
        )
      )
    );

  const limitedField =
    result.fieldAdequacy?.limitedField === true ||
    result.fieldAdequacy?.adequateForPopulationAssessment === false ||
    result.marrowAdequacyMorphologyAxis?.adequacyClassification ===
      "CLASS_1_LIMITED_FIELD";

  return {
    version: MARROW_MYELOPROLIFERATIVE_PATTERN_CORRELATION_VERSION,
    active: protectedExpansion && !blast.suspicious,
    protectedExpansion,
    structuredBlastAuthority: blast,
    severityScore: score,
    severityLevel: level,
    severityLabel: severityLabel(level),
    limitedField,
    confidenceCriticalityAxisSeparated: true,
    myeloproliferativeSignalCount,
    myeloproliferativePatternSupported,
    highSalienceCriticalSignature,
    highSalienceSupportiveModifiers,
    criticalityCalibrationVersion:
      MARROW_TERMINAL_CRITICALITY_CORE_SIGNATURE_VERSION,
    previousCriticalityCalibrationVersion:
      MARROW_HIGH_SALIENCE_CRITICALITY_LOCK_VERSION,
    bcrAbl1RecommendationGate: bcrAbl1ContextGate
      ? "CONSIDER_IF_CLINICOLABORATORY_CONTEXT_CORROBORATES"
      : "NOT_TRIGGERED",
    morphologyOnlyDiagnosisAllowed: false,
    cmlDiagnosisEmitted: false,
    evidence: {
      expansionScore,
      disproportionateAxis: expansion.disproportionateAxis === true,
      expansionBurdenAxis: expansion.expansionBurdenAxis === true,
      maturationAxis: expansion.maturationAxis === true,
      relativeMyeloidPredominance:
        bool(signals.relativeMyeloidPredominance),
      disproportionateMyeloidRepresentation:
        bool(signals.disproportionateMyeloidRepresentation),
      numerousGranulocyticPrecursors:
        bool(signals.numerousGranulocyticPrecursors),
      broadMaturationSpectrum:
        bool(signals.broadMaturationSpectrum),
      matureFormsPresent:
        bool(signals.matureFormsPresent),
      leftShiftedMaturationSpectrum:
        bool(signals.leftShiftedMaturationSpectrum),
      erythroidRelativeReduction:
        bool(signals.erythroidRelativeReduction),
      basophilEosinophilEnrichment:
        bool(signals.basophilEosinophilEnrichment),
      denseMyeloidField:
        bool(signals.denseMyeloidField),
    },
  };
}

export function applyMarrowMyeloproliferativePatternCriticality(
  result = {},
) {
  if (!result || typeof result !== "object") return result;

  const decision =
    evaluateMarrowMyeloproliferativePatternCriticality(result);

  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    overallAssessment: { ...obj(result.overallAssessment) },
    structuredReport: { ...obj(result.structuredReport) },
    confidenceAnalysis: { ...obj(result.confidenceAnalysis) },
    marrowMyeloproliferativePatternCorrelation: decision,
    marrowSeverityCriticality: {
      version: MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
      score: decision.severityScore,
      level: decision.severityLevel,
      label: decision.severityLabel,
      limitedFieldDoesNotDowngradeSeverity: true,
      confidenceCriticalityAxisSeparationVersion:
        MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
    },
  };

  // True structured blastoid architecture remains clinically dominant.
  if (!decision.active) {
    return out;
  }

  const highSalience =
    decision.severityLevel === "HIGH" ||
    decision.severityLevel === "CRITICAL";

  out.clinicalCriticality = {
    version: MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
    level: decision.severityLevel,
    score: decision.severityScore,
    label: decision.severityLabel,
    urgency:
      decision.severityLevel === "CRITICAL"
        ? "PRIORITY_HEMATOLOGY_REVIEW"
        : decision.severityLevel === "HIGH"
          ? "EXPEDITED_HEMATOLOGY_REVIEW"
          : "HEMATOLOGY_REVIEW",
    diagnosticConfidenceIndependent: true,
    adequacyIndependent: true,
    axes: {
      morphologicCriticality: {
        level: decision.severityLevel,
        score: decision.severityScore,
        source: "DIRECT_VISUAL_MORPHOLOGY",
      },
      clinicalContextSeverity: {
        level: "NOT_INFERRED_FROM_IMAGE",
        source: "SEPARATE_CLINICAL_CONTEXT_AXIS",
      },
      diagnosticConcordance: {
        level: "NOT_ESTABLISHED_BY_IMAGE_ALONE",
        source: "REQUIRES_CLINICAL_LABORATORY_CORRELATION",
      },
    },
  };

  // Keep morphology classification unchanged; calibrate clinical urgency.
  out.riskLevel = severityRiskLevel(decision.severityLevel);
  out.requiresHumanReview = true;
  out.normalityBlocked = true;
  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.clinicalCriticality =
    out.clinicalCriticality;
  out.overallAssessment.morphologySeverity = {
    score: decision.severityScore,
    level: decision.severityLevel,
  };

  const correlationText =
    "O padrão observado é de expansão mieloide/granulocítica desproporcional " +
    "com maturação e pode integrar um padrão mieloproliferativo no contexto " +
    "clínico-laboratorial apropriado. A imagem isolada não estabelece entidade " +
    "hematológica nem etiologia.";

  out.clinicalMeaning =
    appendSentence(out.clinicalMeaning, correlationText);

  out.interpretiveSynthesis =
    appendSentence(out.interpretiveSynthesis, correlationText);

  if (highSalience) {
    out.blockNormalReason = uniqueStrings([
      ...(Array.isArray(out.blockNormalReason)
        ? out.blockNormalReason
        : []),
      decision.severityLevel === "CRITICAL"
        ? "Expansão mieloide/granulocítica de muito alta saliência morfológica."
        : "Expansão mieloide/granulocítica de alta saliência morfológica.",
      "Campo limitado reduz confiança diagnóstica, mas não reduz automaticamente a criticidade do achado positivo observado.",
    ]);

    out.structuredReport.hematologicMeaning =
      appendSentence(
        out.structuredReport.hematologicMeaning,
        correlationText,
      );
  }

  if (decision.myeloproliferativePatternSupported) {
    out.possibleClinicalCorrelations = uniqueStrings([
      ...(Array.isArray(out.possibleClinicalCorrelations)
        ? out.possibleClinicalCorrelations
        : []),
      "Padrão mieloproliferativo a considerar no contexto clínico-laboratorial apropriado.",
    ]);

    out.associatedEducationalHypotheses = uniqueStrings([
      ...(Array.isArray(out.associatedEducationalHypotheses)
        ? out.associatedEducationalHypotheses
        : []),
      "Processo mieloproliferativo como hipótese educacional de correlação; não diagnosticável pela imagem isolada.",
    ]);
  }

  if (
    decision.bcrAbl1RecommendationGate ===
      "CONSIDER_IF_CLINICOLABORATORY_CONTEXT_CORROBORATES"
  ) {
    const molecularRecommendation =
      "Se hemograma, diferencial e contexto clínico corroborarem processo " +
      "mieloproliferativo (por exemplo leucocitose/neutrofilia com desvio à " +
      "esquerda, com ou sem basofilia), considerar investigação de BCR::ABL1. " +
      "A confirmação de leucemia mieloide crônica depende de demonstração " +
      "apropriada de BCR::ABL1 e não pode ser feita pela imagem isolada.";

    out.clinicalCorrelationNeeds = uniqueStrings([
      ...(Array.isArray(out.clinicalCorrelationNeeds)
        ? out.clinicalCorrelationNeeds
        : []),
      "Hemograma completo com contagem diferencial",
      "Revisão hematológica prioritária",
      "Considerar investigação de BCR::ABL1 se o contexto clínico-laboratorial corroborar padrão mieloproliferativo",
    ]);

    out.structuredReport.recommendation =
      appendSentence(
        out.structuredReport.recommendation,
        molecularRecommendation,
      );

    out.recommendedCorrelation = uniqueStrings([
      ...(Array.isArray(out.recommendedCorrelation)
        ? out.recommendedCorrelation
        : []),
      molecularRecommendation,
    ]);

    out.marrowMyeloproliferativePatternCorrelation = {
      ...decision,
      bcrAbl1Recommendation:
        molecularRecommendation,
      cmlDifferentialEducationalOnly: true,
    };
  }

  // Criticality is not confidence. Preserve confidence hierarchy/diagnostic
  // confidence, but calibrate the hematologic-risk channel upward.
  out.confidenceAnalysis = {
    ...out.confidenceAnalysis,
    hematologicRisk: {
      ...obj(out.confidenceAnalysis.hematologicRisk),
      level:
        decision.severityLevel === "CRITICAL"
          ? "critical"
          : decision.severityLevel === "HIGH"
            ? "high"
            : "moderate",
      score: decision.severityScore,
      label: decision.severityLabel,
    },
    calibration: {
      ...obj(out.confidenceAnalysis.calibration),
      marrowSeverityCriticalityCalibrationVersion:
        MARROW_SEVERITY_CRITICALITY_CALIBRATION_VERSION,
      marrowConfidenceCriticalityAxisSeparationVersion:
        MARROW_CONFIDENCE_CRITICALITY_AXIS_SEPARATION_VERSION,
      limitedFieldDoesNotDowngradePositiveMorphologySeverity: true,
    },
  };

  return out;
}

export default applyMarrowMyeloproliferativePatternCriticality;
