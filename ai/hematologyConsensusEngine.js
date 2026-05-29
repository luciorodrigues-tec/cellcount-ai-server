// ============================================================================
// CELLCOUNT ENTERPRISE
// HEMATOLOGY CONSENSUS ENGINE
// ============================================================================

export function buildConsensusAnalysis(
  analyses = [],
) {

  // ========================================================================
  // EMPTY
  // ========================================================================

  if (
    !analyses ||
    !analyses.length
  ) {

    return {

      confidenceLevel:
        'low',

      consistencyScore: 0,

      repeatedFindings: [],

      divergentFindings: [],

      finalInterpretation:
        'Sem análises suficientes.',
    };
  }

  // ========================================================================
  // STORAGE
  // ========================================================================

  const morphologyFrequency =
    new Map();

  const alertFrequency =
    new Map();

  const conditionFrequency =
    new Map();

  const confidenceMap = {

    blasts: [],

    schistocytes: [],

    dysplasia: [],

    leftShift: [],
  };

  // ========================================================================
  // LOOP
  // ========================================================================

  for (const analysis of analyses) {

    // ======================================================================
    // MORPHOLOGIES
    // ======================================================================

    const morphologies =
      analysis?.morphologies || [];

    for (const morphology of morphologies) {

      morphologyFrequency.set(

        morphology,

        (morphologyFrequency.get(
          morphology,
        ) || 0) + 1,
      );
    }

    // ======================================================================
    // ALERTS
    // ======================================================================

    const alerts =
      analysis?.alerts || [];

    for (const alert of alerts) {

      alertFrequency.set(

        alert,

        (alertFrequency.get(
          alert,
        ) || 0) + 1,
      );
    }

    // ======================================================================
    // CONDITIONS
    // ======================================================================

    const conditions =
      analysis?.suspectedConditions || [];

    for (const condition of conditions) {

      conditionFrequency.set(

        condition,

        (conditionFrequency.get(
          condition,
        ) || 0) + 1,
      );
    }

    // ======================================================================
    // CONFIDENCE MATRIX
    // ======================================================================

    const matrix =
      analysis
        ?.morphologicConfidenceMatrix;

    if (matrix) {

      confidenceMap.blasts.push(

        matrix
          ?.blastAssessment
          ?.confidence || 0,
      );

      confidenceMap.schistocytes.push(

        matrix
          ?.schistocyteAssessment
          ?.confidence || 0,
      );

      confidenceMap.dysplasia.push(

        matrix
          ?.dysplasiaAssessment
          ?.confidence || 0,
      );

      confidenceMap.leftShift.push(

        matrix
          ?.leftShiftAssessment
          ?.confidence || 0,
      );
    }
  }

  // ========================================================================
  // REPEATED FINDINGS
  // ========================================================================

  const repeatedFindings = [];

  const divergentFindings = [];

  for (const [
    morphology,
    frequency,
  ] of morphologyFrequency.entries()) {

    const ratio =
      frequency / analyses.length;

    if (ratio >= 0.5) {

      repeatedFindings.push({

        morphology,

        frequency,

        confidence:
          Math.round(
            ratio * 100,
          ),
      });

    } else {

      divergentFindings.push({

        morphology,

        frequency,
      });
    }
  }

  // ========================================================================
  // CONFIDENCE
  // ========================================================================

  const blastConsensus =
    average(
      confidenceMap.blasts,
    );

  const schistocyteConsensus =
    average(
      confidenceMap.schistocytes,
    );

  const dysplasiaConsensus =
    average(
      confidenceMap.dysplasia,
    );

  const leftShiftConsensus =
    average(
      confidenceMap.leftShift,
    );

  // ========================================================================
  // CONSISTENCY SCORE
  // ========================================================================

  const consistencyScore =
    Math.round(

      (
        blastConsensus +
        schistocyteConsensus +
        dysplasiaConsensus +
        leftShiftConsensus
      ) / 4,
    );

  // ========================================================================
  // LEVEL
  // ========================================================================

  let confidenceLevel =
    'low';

  if (consistencyScore >= 70) {

    confidenceLevel =
      'high';

  } else if (
    consistencyScore >= 40
  ) {

    confidenceLevel =
      'moderate';
  }

  // ========================================================================
  // INTERPRETATION
  // ========================================================================

  let finalInterpretation =
    'Achados morfológicos discretos e sem forte consistência multicampo.';

  if (
    repeatedFindings.length >= 3
  ) {

    finalInterpretation =
      'Achados morfológicos repetidos em múltiplos campos, aumentando confiabilidade hematológica.';
  }

  if (
    blastConsensus >= 70
  ) {

    finalInterpretation +=
      ' Presença consistente de células imaturas suspeitas.';
  }

  if (
    schistocyteConsensus >= 60
  ) {

    finalInterpretation +=
      ' Fragmentação eritrocitária repetida observada.';
  }

  // ========================================================================
  // RETURN
  // ========================================================================

  return {

    confidenceLevel,

    consistencyScore,

    repeatedFindings,

    divergentFindings,

    confidenceMatrix: {

      blastConsensus,

      schistocyteConsensus,

      dysplasiaConsensus,

      leftShiftConsensus,
    },

    finalInterpretation,

    metadata: {

      analyzedFields:
        analyses.length,

      repeatedFindingsCount:
        repeatedFindings.length,

      divergentFindingsCount:
        divergentFindings.length,
    },
  };
}

// ============================================================================
// AVERAGE
// ============================================================================

function average(values = []) {

  if (!values.length) {

    return 0;
  }

  const total =
    values.reduce(

      (sum, value) =>
        sum + value,

      0,
    );

  return Math.round(
    total / values.length,
  );
}