// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY CONFIDENCE ENGINE
// ============================================================================

export function buildConfidenceAnalysis({

  analysis,

  consensusResult = null,

  imageQuality = null,
}) {

  // ========================================================================
  // SAFETY
  // ========================================================================

  if (!analysis) {

    return buildEmptyConfidence();
  }

  // ========================================================================
  // QUALITY
  // ========================================================================

  const qualityScore =

    imageQuality ||

    analysis
      ?.microscopyQualityScore
      ?.overall ||

    50;

  // ========================================================================
  // COUNTS
  // ========================================================================

  const counts =
    analysis?.counts || {};

  // ========================================================================
  // MATRIX
  // ========================================================================

  const matrix =
    analysis
      ?.morphologicConfidenceMatrix || {};

  // ========================================================================
  // CONSENSUS
  // ========================================================================

  const consensusMatrix =
    consensusResult
      ?.confidenceMatrix || {};

  // ========================================================================
  // BLASTS
  // ========================================================================

  const blastConfidence =
    calculateBlastConfidence({

      matrix,

      counts,

      qualityScore,

      consensusMatrix,
    });

  // ========================================================================
  // SCHISTOCYTES
  // ========================================================================

  const schistocyteConfidence =
    calculateSchistocyteConfidence({

      matrix,

      analysis,

      qualityScore,

      consensusMatrix,
    });

  // ========================================================================
  // ANISOCYTOSIS
  // ========================================================================

  const anisocytosisConfidence =
    calculateAnisocytosisConfidence({

      analysis,

      qualityScore,
    });

  // ========================================================================
  // HYPOCHROMIA
  // ========================================================================

  const hypochromiaConfidence =
    calculateHypochromiaConfidence({

      analysis,

      qualityScore,
    });

  // ========================================================================
  // INFLAMMATORY
  // ========================================================================

  const inflammatoryPatternConfidence =
    calculateInflammatoryConfidence({

      counts,

      matrix,

      qualityScore,
    });

  // ========================================================================
  // PLATELETS
  // ========================================================================

  const plateletAdequacyConfidence =
    calculatePlateletConfidence({

      analysis,

      qualityScore,
    });

  // ========================================================================
  // DYSPLASIA
  // ========================================================================

  const dysplasiaConfidence =
    calculateDysplasiaConfidence({

      matrix,

      qualityScore,

      consensusMatrix,
    });

  // ========================================================================
  // GLOBAL SCORE
  // ========================================================================

  const globalConfidenceScore =
    calculateGlobalScore({

      blastConfidence,

      schistocyteConfidence,

      anisocytosisConfidence,

      hypochromiaConfidence,

      inflammatoryPatternConfidence,

      plateletAdequacyConfidence,

      dysplasiaConfidence,
    });

  // ========================================================================
  // HEMATOLOGIC RISK
  // ========================================================================

  const hematologicRisk =
    calculateRiskCategory({

      blastConfidence,

      schistocyteConfidence,

      dysplasiaConfidence,

      inflammatoryPatternConfidence,
    });

  // ========================================================================
  // RETURN
  // ========================================================================

  return {

    globalConfidenceScore,

    hematologicRisk,

    microscopyQuality: {

      score: qualityScore,

      classification:
        classifyQuality(
          qualityScore,
        ),
    },

    confidenceMatrix: {

      blastConfidence,

      schistocyteConfidence,

      anisocytosisConfidence,

      hypochromiaConfidence,

      inflammatoryPatternConfidence,

      plateletAdequacyConfidence,

      dysplasiaConfidence,
    },

    summary: buildSummary({

      globalConfidenceScore,

      hematologicRisk,

      blastConfidence,

      schistocyteConfidence,
    }),
  };
}

// ============================================================================
// BLAST CONFIDENCE
// ============================================================================

function calculateBlastConfidence({

  matrix,

  counts,

  qualityScore,

  consensusMatrix,
}) {

  let score =

    matrix
      ?.blastAssessment
      ?.confidence || 0;

  const blastCount =
    counts?.Blasto || 0;

  // ========================================================================
  // COUNT BOOST
  // ========================================================================

  if (blastCount >= 5) {

    score += 15;
  }

  if (blastCount >= 10) {

    score += 10;
  }

  // ========================================================================
  // QUALITY
  // ========================================================================

  score *=
    qualityScore / 100;

  // ========================================================================
  // CONSENSUS
  // ========================================================================

  if (
    consensusMatrix
      ?.blastConsensus
  ) {

    score =
      (
        score +
        consensusMatrix
          .blastConsensus
      ) / 2;
  }

  return normalize(score);
}

// ============================================================================
// SCHISTOCYTES
// ============================================================================

function calculateSchistocyteConfidence({

  matrix,

  analysis,

  qualityScore,

  consensusMatrix,
}) {

  let score =

    matrix
      ?.schistocyteAssessment
      ?.confidence || 0;

  const morphologies =
    analysis?.morphologies || [];

  // ========================================================================
  // MORPHOLOGY BOOST
  // ========================================================================

  if (
    morphologies.includes(
      'Esquizócitos',
    )
  ) {

    score += 12;
  }

  score *=
    qualityScore / 100;

  if (
    consensusMatrix
      ?.schistocyteConsensus
  ) {

    score =
      (
        score +
        consensusMatrix
          .schistocyteConsensus
      ) / 2;
  }

  return normalize(score);
}

// ============================================================================
// ANISOCYTOSIS
// ============================================================================

function calculateAnisocytosisConfidence({

  analysis,

  qualityScore,
}) {

  let score = 0;

  const morphologies =
    analysis?.morphologies || [];

  const interpretation =
    (
      analysis
        ?.erythrocyteEvaluation ||
      ''
    ).toLowerCase();

  if (
    morphologies.includes(
      'Anisocitose',
    )
  ) {

    score += 45;
  }

  if (
    interpretation.includes(
      'anisocitose',
    )
  ) {

    score += 25;
  }

  score *=
    qualityScore / 100;

  return normalize(score);
}

// ============================================================================
// HYPOCHROMIA
// ============================================================================

function calculateHypochromiaConfidence({

  analysis,

  qualityScore,
}) {

  let score = 0;

  const morphologies =
    analysis?.morphologies || [];

  const interpretation =
    (
      analysis
        ?.erythrocyteEvaluation ||
      ''
    ).toLowerCase();

  if (
    morphologies.includes(
      'Hipocromia',
    )
  ) {

    score += 40;
  }

  if (
    interpretation.includes(
      'hipocrom')
  ) {

    score += 25;
  }

  score *=
    qualityScore / 100;

  return normalize(score);
}

// ============================================================================
// INFLAMMATORY
// ============================================================================

function calculateInflammatoryConfidence({

  counts,

  matrix,

  qualityScore,
}) {

  let score = 0;

  const segmented =
    counts?.Segmentado || 0;

  const bastonete =
    counts?.Bastonete || 0;

  // ========================================================================
  // NEUTROPHILIA
  // ========================================================================

  if (segmented >= 70) {

    score += 30;
  }

  // ========================================================================
  // LEFT SHIFT
  // ========================================================================

  if (bastonete >= 10) {

    score += 25;
  }

  score +=

    (
      matrix
        ?.leftShiftAssessment
        ?.confidence || 0
    ) * 0.5;

  score *=
    qualityScore / 100;

  return normalize(score);
}

// ============================================================================
// PLATELETS
// ============================================================================

function calculatePlateletConfidence({

  analysis,

  qualityScore,
}) {

  let score = 55;

  const plateletEvaluation =
    (
      analysis
        ?.plateletEvaluation ||
      ''
    ).toLowerCase();

  if (
    plateletEvaluation.includes(
      'adequado',
    )
  ) {

    score += 20;
  }

  if (
    plateletEvaluation.includes(
      'reduzido',
    )
  ) {

    score -= 15;
  }

  score *=
    qualityScore / 100;

  return normalize(score);
}

// ============================================================================
// DYSPLASIA
// ============================================================================

function calculateDysplasiaConfidence({

  matrix,

  qualityScore,

  consensusMatrix,
}) {

  let score =

    matrix
      ?.dysplasiaAssessment
      ?.confidence || 0;

  score *=
    qualityScore / 100;

  if (
    consensusMatrix
      ?.dysplasiaConsensus
  ) {

    score =
      (
        score +
        consensusMatrix
          .dysplasiaConsensus
      ) / 2;
  }

  return normalize(score);
}

// ============================================================================
// GLOBAL SCORE
// ============================================================================

function calculateGlobalScore({

  blastConfidence,

  schistocyteConfidence,

  anisocytosisConfidence,

  hypochromiaConfidence,

  inflammatoryPatternConfidence,

  plateletAdequacyConfidence,

  dysplasiaConfidence,
}) {

  const score =

    blastConfidence * 0.24 +

    schistocyteConfidence * 0.18 +

    anisocytosisConfidence * 0.14 +

    hypochromiaConfidence * 0.10 +

    inflammatoryPatternConfidence * 0.12 +

    plateletAdequacyConfidence * 0.08 +

    dysplasiaConfidence * 0.14;

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
}) {

  const riskScore =

    blastConfidence * 0.45 +

    schistocyteConfidence * 0.25 +

    dysplasiaConfidence * 0.20 +

    inflammatoryPatternConfidence * 0.10;

  // ========================================================================
  // CATEGORY
  // ========================================================================

  if (riskScore >= 70) {

    return {

      level: 'critical',

      score:
        normalize(
          riskScore,
        ),

      label:
        'ALTO RISCO HEMATOLÓGICO',
    };
  }

  if (riskScore >= 40) {

    return {

      level: 'moderate',

      score:
        normalize(
          riskScore,
        ),

      label:
        'RISCO MODERADO',
    };
  }

  return {

    level: 'low',

    score:
      normalize(
        riskScore,
      ),

    label:
      'BAIXO RISCO',
    };
}

// ============================================================================
// QUALITY CLASSIFICATION
// ============================================================================

function classifyQuality(
  score,
) {

  if (score >= 80) {

    return 'Excelente';
  }

  if (score >= 60) {

    return 'Boa';
  }

  if (score >= 40) {

    return 'Moderada';
  }

  return 'Baixa';
}

// ============================================================================
// SUMMARY
// ============================================================================

function buildSummary({

  globalConfidenceScore,

  hematologicRisk,

  blastConfidence,

  schistocyteConfidence,
}) {

  let summary =
    'Análise hematológica processada com coerência multicampo.';

  if (blastConfidence >= 70) {

    summary +=
      ' Alta suspeita de células imaturas.';
  }

  if (
    schistocyteConfidence >= 60
  ) {

    summary +=
      ' Fragmentação eritrocitária relevante detectada.';
  }

  summary += ` Nível global de confiança: ${globalConfidenceScore}%.`;

  summary += ` Classificação: ${hematologicRisk.label}.`;

  return summary;
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
// EMPTY
// ============================================================================

function buildEmptyConfidence() {

  return {

    globalConfidenceScore: 0,

    hematologicRisk: {

      level: 'unknown',

      score: 0,

      label:
        'SEM DADOS',
    },

    microscopyQuality: {

      score: 0,

      classification:
        'Indeterminada',
    },

    confidenceMatrix: {

      blastConfidence: 0,

      schistocyteConfidence: 0,

      anisocytosisConfidence: 0,

      hypochromiaConfidence: 0,

      inflammatoryPatternConfidence: 0,

      plateletAdequacyConfidence: 0,

      dysplasiaConfidence: 0,
    },

    summary:
      'Sem informações suficientes para análise.',
  };
}