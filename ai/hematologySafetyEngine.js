// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY SAFETY ENGINE
// ============================================================================

export function validateHematologyAnalysis(
  analysis,
) {

  // ========================================================================
  // DEFAULT
  // ========================================================================

  if (!analysis) {

    return {

      valid: false,

      severity: 'critical',

      alerts: [

        'Resultado hematológico ausente.',
      ],

      correctedAnalysis: {},
    };
  }

  // ========================================================================
  // STORAGE
  // ========================================================================

  const safetyAlerts = [];

  const correctedAnalysis =
    structuredClone(
      analysis,
    );

  // ========================================================================
  // ENSURE STRUCTURE
  // ========================================================================

  ensureStructure(
    correctedAnalysis,
  );

  // ========================================================================
  // QUALITY SCORE
  // ========================================================================

  const quality =
    correctedAnalysis
      ?.microscopyQualityScore
      ?.overall || 0;

  // ========================================================================
  // BLAST VALIDATION
  // ========================================================================

  validateBlastConsistency({

    analysis:
      correctedAnalysis,

    quality,

    safetyAlerts,
  });

  // ========================================================================
  // SCHISTOCYTE VALIDATION
  // ========================================================================

  validateSchistocyteConsistency({

    analysis:
      correctedAnalysis,

    quality,

    safetyAlerts,
  });

  // ========================================================================
  // LEFT SHIFT VALIDATION
  // ========================================================================

  validateLeftShift({

    analysis:
      correctedAnalysis,

    safetyAlerts,
  });

  // ========================================================================
  // DYSPLASIA VALIDATION
  // ========================================================================

  validateDysplasia({

    analysis:
      correctedAnalysis,

    safetyAlerts,
  });

  // ========================================================================
  // HYPERCONFIDENCE BLOCK
  // ========================================================================

  validateOverconfidence({

    analysis:
      correctedAnalysis,

    quality,

    safetyAlerts,
  });

  // ========================================================================
  // RISK COHERENCE
  // ========================================================================

  validateRiskCoherence({

    analysis:
      correctedAnalysis,

    safetyAlerts,
  });

  // ========================================================================
  // HEATMAP VALIDATION
  // ========================================================================

  validateHeatmaps({

    analysis:
      correctedAnalysis,

    safetyAlerts,
  });

  // ========================================================================
  // FINAL SEVERITY
  // ========================================================================

  let severity = 'low';

  if (safetyAlerts.length >= 3) {

    severity = 'moderate';
  }

  if (safetyAlerts.length >= 6) {

    severity = 'high';
  }

  // ========================================================================
  // RETURN
  // ========================================================================

  return {

    valid:
      safetyAlerts.length === 0,

    severity,

    alerts: safetyAlerts,

    correctedAnalysis,
  };
}

// ============================================================================
// ENSURE STRUCTURE
// ============================================================================

function ensureStructure(
  analysis,
) {

  if (!analysis.counts) {

    analysis.counts = {};
  }

  if (!analysis.alerts) {

    analysis.alerts = [];
  }

  if (!analysis.morphologies) {

    analysis.morphologies = [];
  }

  if (
    !analysis
      .morphologicConfidenceMatrix
  ) {

    analysis
      .morphologicConfidenceMatrix = {};
  }
}

// ============================================================================
// BLAST VALIDATION
// ============================================================================

function validateBlastConsistency({

  analysis,

  quality,

  safetyAlerts,
}) {

  const blastConfidence =
    analysis
      ?.morphologicConfidenceMatrix
      ?.blastAssessment
      ?.confidence || 0;

  const blastCount =
    analysis?.counts?.Blasto || 0;

  const interpretation =
    analysis
      ?.morphologicConfidenceMatrix
      ?.blastAssessment
      ?.interpretation || '';

  // ========================================================================
  // LOW QUALITY
  // ========================================================================

  if (
    quality < 40 &&
    blastConfidence > 70
  ) {

    safetyAlerts.push(

      'Confiança excessiva para blastos em imagem de baixa qualidade.',
    );

    analysis
      .morphologicConfidenceMatrix
      .blastAssessment
      .confidence = 45;
  }

  // ========================================================================
  // BLAST WITHOUT DESCRIPTION
  // ========================================================================

  const hasMorphologicCriteria =

    interpretation
      .toLowerCase()
      .includes(
        'nucléolo',
      ) ||

    interpretation
      .toLowerCase()
      .includes(
        'cromatina',
      );

  if (
    blastConfidence > 60 &&
    !hasMorphologicCriteria
  ) {

    safetyAlerts.push(

      'Suspeita de blastos sem critérios morfológicos suficientes.',
    );

    analysis
      .morphologicConfidenceMatrix
      .blastAssessment
      .confidence = 35;
  }

  // ========================================================================
  // BLAST COUNT
  // ========================================================================

  if (
    blastCount > 0 &&
    blastConfidence < 20
  ) {

    safetyAlerts.push(

      'Contagem de blastos inconsistente com confiança morfológica.',
    );
  }
}

// ============================================================================
// SCHISTOCYTE VALIDATION
// ============================================================================

function validateSchistocyteConsistency({

  analysis,

  quality,

  safetyAlerts,
}) {

  const schistocyteConfidence =
    analysis
      ?.morphologicConfidenceMatrix
      ?.schistocyteAssessment
      ?.confidence || 0;

  const morphologies =
    analysis?.morphologies || [];

  const hasSchistocytes =
    morphologies.includes(
      'Esquizócitos',
    );

  // ========================================================================
  // LOW QUALITY
  // ========================================================================

  if (
    quality < 45 &&
    schistocyteConfidence > 70
  ) {

    safetyAlerts.push(

      'Fragmentação eritrocitária sugerida com baixa qualidade microscópica.',
    );

    analysis
      .morphologicConfidenceMatrix
      .schistocyteAssessment
      .confidence = 40;
  }

  // ========================================================================
  // INCONSISTENCY
  // ========================================================================

  if (
    hasSchistocytes &&
    schistocyteConfidence < 25
  ) {

    safetyAlerts.push(

      'Esquizócitos reportados com baixa confiança.',
    );
  }
}

// ============================================================================
// LEFT SHIFT VALIDATION
// ============================================================================

function validateLeftShift({

  analysis,

  safetyAlerts,
}) {

  const counts =
    analysis?.counts || {};

  const immatureCells =

    (counts.Promielócito || 0) +

    (counts.Mielócito || 0) +

    (counts.Metamielócito || 0);

  const leftShiftConfidence =
    analysis
      ?.morphologicConfidenceMatrix
      ?.leftShiftAssessment
      ?.confidence || 0;

  // ========================================================================
  // NO IMMATURES
  // ========================================================================

  if (
    immatureCells === 0 &&
    leftShiftConfidence > 50
  ) {

    safetyAlerts.push(

      'Desvio à esquerda sugerido sem células imaturas suficientes.',
    );

    analysis
      .morphologicConfidenceMatrix
      .leftShiftAssessment
      .confidence = 20;
  }
}

// ============================================================================
// DYSPLASIA
// ============================================================================

function validateDysplasia({

  analysis,

  safetyAlerts,
}) {

  const dysplasiaConfidence =
    analysis
      ?.morphologicConfidenceMatrix
      ?.dysplasiaAssessment
      ?.confidence || 0;

  const interpretation =
    analysis
      ?.morphologicConfidenceMatrix
      ?.dysplasiaAssessment
      ?.interpretation || '';

  // ========================================================================
  // SINGLE CELL DYPLASIA
  // ========================================================================

  const weakCriteria =

    interpretation
      .toLowerCase()
      .includes(
        'isolada',
      ) ||

    interpretation
      .toLowerCase()
      .includes(
        'ocasional',
      );

  if (
    dysplasiaConfidence > 60 &&
    weakCriteria
  ) {

    safetyAlerts.push(

      'Displasia sugerida com critérios insuficientes.',
    );

    analysis
      .morphologicConfidenceMatrix
      .dysplasiaAssessment
      .confidence = 35;
  }
}

// ============================================================================
// OVERCONFIDENCE
// ============================================================================

function validateOverconfidence({

  analysis,

  quality,

  safetyAlerts,
}) {

  const matrix =
    analysis
      ?.morphologicConfidenceMatrix || {};

  const assessments = [

    'blastAssessment',

    'schistocyteAssessment',

    'dysplasiaAssessment',

    'leftShiftAssessment',
  ];

  for (const key of assessments) {

    const confidence =
      matrix?.[key]
        ?.confidence || 0;

    if (
      quality < 50 &&
      confidence > 85
    ) {

      safetyAlerts.push(

        `Excesso de confiança detectado em ${key}.`,
      );

      matrix[key]
        .confidence = 55;
    }
  }
}

// ============================================================================
// RISK COHERENCE
// ============================================================================

function validateRiskCoherence({

  analysis,

  safetyAlerts,
}) {

  const riskLevel =
    analysis?.riskLevel || '';

  const blastConfidence =
    analysis
      ?.morphologicConfidenceMatrix
      ?.blastAssessment
      ?.confidence || 0;

  // ========================================================================
  // HIGH RISK WITHOUT EVIDENCE
  // ========================================================================

  if (
    riskLevel
      .toLowerCase()
      .includes('alto') &&
    blastConfidence < 20
  ) {

    safetyAlerts.push(

      'Risco hematológico elevado sem critérios suficientes.',
    );
  }
}

// ============================================================================
// HEATMAPS
// ============================================================================

function validateHeatmaps({

  analysis,

  safetyAlerts,
}) {

  const heatmaps =
    analysis?.heatmapRegions || [];

  for (const region of heatmaps) {

    // ======================================================================
    // INVALID REGION
    // ======================================================================

    if (
      region.width <= 0 ||
      region.height <= 0
    ) {

      safetyAlerts.push(

        'Heatmap com dimensões inválidas.',
      );
    }

    // ======================================================================
    // INVALID CONFIDENCE
    // ======================================================================

    if (
      region.confidence > 100 ||
      region.confidence < 0
    ) {

      safetyAlerts.push(

        'Heatmap com confiança inválida.',
      );

      region.confidence = 0;
    }
  }
}