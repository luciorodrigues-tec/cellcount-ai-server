// ============================================================================
// HOSPITAL AI CORRELATION ENGINE
// CELLCOUNT ENTERPRISE
// backend/services/medicalCorrelationEngine.js
// ============================================================================

export function correlateHematology({
  differential = {},
  morphology = [],
  imageQuality = {},
  confidence = {},
}) {

  // =========================================================================
  // SAFE PARSING
  // =========================================================================

  const get = (key) =>
    Number(differential[key] || 0);

  const blast =
      get('Blasto');

  const promyelocyte =
      get('Promielócito');

  const myelocyte =
      get('Mielócito');

  const metamyelocyte =
      get('Metamielócito');

  const band =
      get('Bastonete');

  const segmented =
      get('Segmentado');

  const lymphocyte =
      get('Linfócito');

  const reactiveLymph =
      get('Linfócito Reativo');

  const monocyte =
      get('Monócito');

  const eosinophil =
      get('Eosinófilo');

  const basophil =
      get('Basófilo');

  // =========================================================================
  // FLAGS
  // =========================================================================

  const hasBlast =
      blast > 0;

  const leftShift =
      promyelocyte > 0 ||
      myelocyte > 0 ||
      metamyelocyte > 0 ||
      band > 10;

  const reactivePattern =
      reactiveLymph > 5;

  const eosinophilia =
      eosinophil >= 6;

  const basophilia =
      basophil >= 2;

  // =========================================================================
  // MORPHOLOGY FLAGS
  // =========================================================================

  const schistocytes =
      morphology.includes(
        'Esquizócitos',
      );

  const anisocytosis =
      morphology.includes(
        'Anisocitose',
      );

  const hypochromia =
      morphology.includes(
        'Hipocromia',
      );

  const macrocytosis =
      morphology.includes(
        'Macrocitose',
      );

  const microcytosis =
      morphology.includes(
        'Microcitose',
      );

  const toxicGranulations =
      morphology.includes(
        'Granulações tóxicas',
      );

  // =========================================================================
  // CLINICAL ALERTS
  // =========================================================================

  const alerts = [];

  if (hasBlast) {

    alerts.push({
      severity: 'critical',
      title:
          'Suspeita de blastos circulantes',
      recommendation:
          'Correlacionar com mielograma, citometria de fluxo e avaliação hematológica especializada.',
    });
  }

  if (leftShift) {

    alerts.push({
      severity: 'moderate',
      title:
          'Desvio à esquerda identificado',
      recommendation:
          'Avaliar contexto infeccioso, inflamatório ou mieloproliferativo.',
    });
  }

  if (schistocytes) {

    alerts.push({
      severity: 'critical',
      title:
          'Esquizócitos identificados',
      recommendation:
          'Correlacionar com hemólise microangiopática e investigação urgente.',
    });
  }

  if (reactivePattern) {

    alerts.push({
      severity: 'moderate',
      title:
          'Padrão linfocitário reativo',
      recommendation:
          'Possível resposta viral ou inflamatória.',
    });
  }

  // =========================================================================
  // CONFIDENCE NORMALIZATION
  // =========================================================================

  const normalizePercent = (
      value,
  ) => {

    const n =
        Number(value || 0);

    // already 0-100

    if (n > 1) {

      return Math.min(
        100,
        Math.max(0, n),
      );
    }

    // convert 0-1 to %

    return Math.min(
      100,
      Math.max(
        0,
        Math.round(n * 100),
      ),
    );
  };

  // =========================================================================
  // STANDARDIZED CONFIDENCE
  // =========================================================================

  const normalizedConfidence = {

    blastConfidence:
        normalizePercent(
      confidence.blastConfidence ??
      confidence.blast ??
      confidence.blastScore,
    ),

    schistocyteConfidence:
        normalizePercent(
      confidence.schistocyteConfidence ??
      confidence.schistocyte ??
      confidence.schistocytes,
    ),

    dysplasiaConfidence:
        normalizePercent(
      confidence.dysplasiaConfidence ??
      confidence.dysplasia,
    ),

    leftShiftConfidence:
        normalizePercent(
      confidence.leftShiftConfidence ??
      confidence.leftShift,
    ),

    imageQualityConfidence:
        normalizePercent(
      imageQuality.confidence ??
      imageQuality.score,
    ),
  };

  // =========================================================================
  // MEDICAL SUMMARY
  // =========================================================================

  let medicalSummary =
      'Análise hematológica automatizada sem alterações críticas evidentes.';

  if (
      hasBlast &&
      schistocytes
  ) {

    medicalSummary =
        'Achados hematológicos críticos com presença simultânea de blastos e esquizócitos. Correlação clínica urgente recomendada.';
  }

  else if (hasBlast) {

    medicalSummary =
        'Presença de blastos identificada na análise automatizada, sugerindo necessidade de investigação hematológica complementar.';
  }

  else if (schistocytes) {

    medicalSummary =
        'Presença de esquizócitos identificada, podendo estar relacionada a processo hemolítico microangiopático.';
  }

  else if (leftShift) {

    medicalSummary =
        'Padrão compatível com desvio à esquerda, sugerindo resposta inflamatória ou infecciosa.';
  }

  // =========================================================================
  // RBC INTERPRETATION
  // =========================================================================

  const erythrocyteInterpretation = [];

  if (
      !anisocytosis &&
      !microcytosis &&
      !macrocytosis &&
      !hypochromia
  ) {

    erythrocyteInterpretation.push(
      'Hemácias com morfologia globalmente preservada.',
    );
  }

  if (anisocytosis) {

    erythrocyteInterpretation.push(
      'Anisocitose observada.',
    );
  }

  if (microcytosis) {

    erythrocyteInterpretation.push(
      'Microcitose presente.',
    );
  }

  if (macrocytosis) {

    erythrocyteInterpretation.push(
      'Macrocitose identificada.',
    );
  }

  if (hypochromia) {

    erythrocyteInterpretation.push(
      'Hipocromia observada.',
    );
  }

  // =========================================================================
  // FINAL STRUCTURED JSON
  // =========================================================================

  return {

    success: true,

    structured: {

      imageQuality: {

        adequate:
            normalizedConfidence
                .imageQualityConfidence >=
            60,

        confidence:
            normalizedConfidence
                .imageQualityConfidence,
      },

      leukocyteFindings: {

        blastPresent:
            hasBlast,

        leftShift,

        reactivePattern,

        eosinophilia,

        basophilia,
      },

      erythrocyteFindings: {

        summary:
          "Sem alterações eritrocitárias relevantes visualmente identificáveis.",

        schistocytes,

        anisocytosis,

        microcytosis,

        macrocytosis,

        hypochromia,

        interpretation:
          erythrocyteInterpretation,
      },

      confidenceMatrix:
          normalizedConfidence,

      alerts,

      overallAssessment: {

        riskCategory:
            hasBlast ||
                    schistocytes
                ? 'high'
                : leftShift
                    ? 'moderate'
                    : 'low',

        requiresHumanReview:
            hasBlast ||
                schistocytes,

        summary:
            medicalSummary,
      },

      structuredReport: {

        morphologySummary:
            morphology,

        clinicalInterpretation:
            medicalSummary,

        plainTextReport: `

ANÁLISE HEMATOLÓGICA AUTOMATIZADA

Resumo:
${medicalSummary}

Achados Eritrocitários:
${erythrocyteInterpretation.join(' ')}

Achados Morfológicos:
${morphology.join(', ') || 'Sem alterações relevantes.'}

Necessidade de revisão humana:
${
  hasBlast || schistocytes
    ? 'SIM'
    : 'NÃO'
}
        `,
      },
    },
  };
}