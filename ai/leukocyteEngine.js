// ============================================================================
// CELLCOUNT ENTERPRISE
// LEUKOCYTE ENGINE V5 ENTERPRISE CALIBRATED
// NEGATION-AWARE WBC MORPHOLOGY INTERPRETER
// ============================================================================

import {
  WBC_MORPHOLOGY,
} from "./morphologyKnowledgeBase.js";

// ============================================================================

console.log(
  "🧬 LEUKOCYTE ENGINE V5 LOADED",
);

// ============================================================================

export function analyzeLeukocytes(
  analysisText = "",
) {
  const text =
    normalizeText(
      analysisText,
    );

  const findings = [];
  const alerts = [];
  const correlations = [];
  const reasoning = [];
  const contradictionFlags = [];

  const scores = {
    blast: 0,
    leftShift: 0,
    hypersegmentation: 0,
    toxicChanges: 0,
    reactivePattern: 0,
    neoplasticPattern: 0,
    maturationCoherence: 0,
    immatureFeatures: 0,
    inflammatoryActivation: 0,
    dysplasia: 0,
    artifactPattern: 0,
    coherenceScore: 0,
  };

  const noLeukocyteTerms = [
    "ausencia de leucocitos",
    "nao foram observados leucocitos",
    "sem leucocitos",
    "ausencia de serie branca",
    "serie branca nao avaliada",
    "nao aplicavel devido a ausencia de leucocitos",
    "nao ha leucocitos",
  ];

  const normalLeukocyteTerms = [
    "sem alteracoes leucocitarias",
    "sem alteracoes significativas na serie branca",
    "leucocitos sem alteracoes",
    "leukocytes normal",
    "normal leukocyte morphology",
    "neutrophils and lymphocytes are observed with normal morphology",
    "no immature cells or blasts are noted",
    "no blasts observed",
    "blasts not observed",
    "immature cells not observed",
  ];

  const noLeukocytesDetected =
    containsAny(
      text,
      noLeukocyteTerms,
    );

  const normalLeukocytePattern =
    containsAny(
      text,
      normalLeukocyteTerms,
    );

  const blastFeatures = [
    "blast",
    "blasts",
    "blasto",
    "blastos",
    "immature cell",
    "immature cells",
    "immature morphology",
    "high nucleus cytoplasm ratio",
    "high n/c ratio",
    "high nc ratio",
    "nucleoli",
    "nucleolus",
    "nucleolo",
    "nucleolos",
    "fine chromatin",
    "open chromatin",
    "delicate chromatin",
    "chromatina frouxa",
    "cromatina frouxa",
    "cromatina delicada",
    "nucleo citoplasma elevado",
    "alta relacao nucleo citoplasma",
    "celulas imaturas",
    "morfologia imatura",
  ];

  const matureFeatures = [
    "segmented",
    "segmentado",
    "mature chromatin",
    "chromatina madura",
    "condensed chromatin",
    "cromatina condensada",
    "lobulated",
    "lobulado",
    "mature cells",
    "celulas maduras",
    "neutrofilo maduro",
    "normal morphology",
    "morfologia normal",
    "segmentation normal",
    "segmentacao normal",
  ];

  const reactiveFeatures = [

    "reactive lymphocyte",
    "linfocito reativo",

    "reactive lymphocytes",
    "linfocitos reativos",

    "activated lymphocyte",
    "activated lymphocytes",

    "linfocito ativado",
    "linfocitos ativados",

    "viral pattern",
    "reactive pattern",

    "atipia reacional",
    "reativo",

    "abundant cytoplasm",
    "cytoplasm abundant",

    "citoplasma abundante",
    "citoplasma amplo",

    "basophilic cytoplasm",
    "cytoplasmic basophilia",

    "citoplasma basofilico",
    "citoplasma levemente basofilico",

    "irregular cytoplasmic borders",
    "scalloped cytoplasm",

    "bordas irregulares",
    "moldando hemacias",

    "skirting",

    "immunoblast",
    "immunoblastic",

    "imunoblasto",
    "imunoblastico",
  ];

  const blastHits =
    countMatches(
      text,
      blastFeatures,
    );

  const matureHits =
    countMatches(
      text,
      matureFeatures,
    );

  const reactiveHits =
    countMatches(
      text,
      reactiveFeatures,
    );

  const strongReactivePattern =
    reactiveHits >= 2;

  const hasLooseChromatin =
    hasPositiveFinding(
      text,
      [
        "fine chromatin",
        "open chromatin",
        "chromatina frouxa",
        "cromatina frouxa",
      ],
    );

  const hasNucleoli =
    hasPositiveFinding(
      text,
      [
        "nucleoli",
        "nucleolus",
        "nucleolos",
        "nucleolo",
      ],
    );

  const hasHighNC =
    hasPositiveFinding(
      text,
      [
        "high nucleus cytoplasm ratio",
        "high n/c ratio",
        "high nc ratio",
        "alta relacao nucleo citoplasma",
      ],
    );

  const hasImmatureCells =
    hasPositiveFinding(
      text,
      [
        "immature cells",
        "immature cell",
        "celulas imaturas",
        "morfologia imatura",
      ],
    );

  let blastCriteria = 0;

  if (hasLooseChromatin) blastCriteria++;
  if (hasNucleoli) blastCriteria++;
  if (hasHighNC) blastCriteria++;
  if (hasImmatureCells) blastCriteria++;

  // ==========================================================================
  // IMMATURE FEATURES — V5 STRICT
  // ==========================================================================

  if (
    blastHits >= 2 &&
    blastCriteria >= 2 &&
    !noLeukocytesDetected &&
    !normalLeukocytePattern
  ) {
    scores.immatureFeatures += blastCriteria;
    scores.blast += blastHits * 1.5;
    scores.coherenceScore += blastCriteria;

    reasoning.push(
      "Características sugestivas de imaturidade leucocitária identificadas com múltiplos critérios positivos.",
    );
  }

  // ==========================================================================
  // TRUE BLAST PATTERN — V5 STRICT
  // ==========================================================================

  if (
    blastCriteria >= 2 &&
    blastHits >= 2 &&
    !noLeukocytesDetected &&
    !normalLeukocytePattern
  ) {
    scores.blast += 6;
    scores.neoplasticPattern += 5;
    scores.coherenceScore += 4;

    findings.push({
      type: "blast_suspicion",
      detected: true,
      confidence: calculateBlastConfidence(
        text,
        blastCriteria,
      ),
      severity: "high",
    });

    alerts.push(
      "Características sugestivas de células imaturas identificadas.",
    );

    reasoning.push(
      "Critérios morfológicos de imaturidade coexistem.",
    );

    correlations.push(
      ...WBC_MORPHOLOGY.blast.correlations,
    );
  }

  // ==========================================================================
  // ABSENCE / NORMAL SUPPRESSION
  // ==========================================================================

  if (
    noLeukocytesDetected ||
    normalLeukocytePattern
  ) {
    scores.blast = 0;
    scores.immatureFeatures = 0;
    scores.neoplasticPattern = 0;

    if (noLeukocytesDetected) {
      reasoning.push(
        "Ausência de leucócitos reduz interpretação morfológica leucocitária.",
      );
    } else {
      reasoning.push(
        "Padrão leucocitário descrito como normal; suspeita blástica suprimida.",
      );
    }
  }

  // ==========================================================================
  // MATURE COHERENCE
  // ==========================================================================

  if (
    reactiveHits >= 1 &&
    !noLeukocytesDetected
  ) {

    scores.reactivePattern +=
      strongReactivePattern
        ? 8
        : 4;

    reasoning.push(
      "Padrão linfocitário reacional identificado.",
    );

    correlations.push(
      "Infecção viral",
      "Resposta imunológica",
      "Ativação linfocitária reacional",
    );

    findings.push(
      "Características compatíveis com linfócitos reativos.",
    );
  }

  // ==========================================================================
  // REACTIVE PATTERN
  // ==========================================================================

  if (
    reactiveHits >= 1 &&
    !noLeukocytesDetected
  ) {
    scores.reactivePattern += reactiveHits * 2;

    reasoning.push(
      "Padrão linfocitário reacional identificado.",
    );

    correlations.push(
      "Infecção viral",
      "Resposta imunológica",
      "Ativação linfocitária reacional",
    );
  }

  // ==========================================================================
  // LEFT SHIFT
  // ==========================================================================

  const immatureGranulocytes = [
    "band neutrophils",
    "bastonetes",
    "bastonete",
    "metamielocito",
    "mielocito",
    "promielocito",
    "immature granulocytes",
    "left shift",
    "desvio a esquerda",
  ];

  const immatureHits =
    countMatches(
      text,
      immatureGranulocytes,
    );

  if (
    immatureHits >= 2 &&
    !noLeukocytesDetected
  ) {
    scores.leftShift += immatureHits * 2;
    scores.inflammatoryActivation += immatureHits;

    findings.push({
      type: "left_shift",
      detected: true,
      severity: WBC_MORPHOLOGY.leftShift.severity,
    });

    alerts.push("Desvio à esquerda identificado.");

    reasoning.push(
      "Granulócitos imaturos descritos em múltiplos critérios.",
    );

    correlations.push(
      "Infecção bacteriana",
      "Resposta inflamatória",
      "Estresse medular",
    );
  }

  // ==========================================================================
  // TOXIC CHANGES
  // ==========================================================================

  const toxicFeatures = [
    "toxic granulation",
    "granulacao toxica",
    "granulacao tóxica",
    "dohle",
    "dohle bodies",
    "vacuolization",
    "vacuolizacao",
    "vacuolização",
    "toxic neutrophil",
  ];

  const toxicHits =
    countMatches(
      text,
      toxicFeatures,
    );

  if (
    toxicHits >= 2 &&
    !noLeukocytesDetected
  ) {
    scores.toxicChanges += toxicHits * 2;
    scores.inflammatoryActivation += 3;

    findings.push({
      type: "toxic_neutrophil_changes",
      detected: true,
      severity: "high",
    });

    alerts.push("Alterações tóxicas neutrofílicas.");

    reasoning.push(
      "Padrão compatível com ativação inflamatória neutrofílica.",
    );

    correlations.push(
      "Infecção bacteriana",
      "Sepse",
      "Inflamação sistêmica",
    );
  }

  // ==========================================================================
  // HYPERSEGMENTATION
  // ==========================================================================

  const hyperFeatures = [
    "hypersegmented",
    "hipersegmentado",
    "more than 5 lobes",
    "5 lobes",
    "6 lobes",
  ];

  const hyperHits =
    countMatches(
      text,
      hyperFeatures,
    );

  if (
    hyperHits >= 2 &&
    !noLeukocytesDetected
  ) {
    scores.hypersegmentation += hyperHits * 2;

    findings.push({
      type: "hypersegmented_neutrophil",
      detected: true,
      severity: WBC_MORPHOLOGY.hypersegmentedNeutrophil.severity,
    });

    reasoning.push(
      "Hipersegmentação neutrofílica consistente.",
    );

    correlations.push(
      ...WBC_MORPHOLOGY
        .hypersegmentedNeutrophil
        .correlations,
    );
  }

  // ==========================================================================
  // DYSPLASIA
  // ==========================================================================

  const dysplasiaTerms = [
    "dysplasia",
    "displasia",
    "pseudo pelger",
    "hipogranulacao",
    "hypogranulation",
    "nuclear irregularity",
    "irregularidade nuclear",
  ];

  const dysplasiaHits =
    countMatches(
      text,
      dysplasiaTerms,
    );

  if (
    dysplasiaHits >= 2 &&
    !noLeukocytesDetected
  ) {
    scores.dysplasia += dysplasiaHits * 2;

    reasoning.push(
      "Características sugestivas de displasia leucocitária identificadas.",
    );

    correlations.push(
      "Myelodysplastic syndrome",
      "Dysplastic hematopoiesis",
    );
  }

  // ==========================================================================
  // ARTIFACT DETECTION
  // ==========================================================================

  const artifactTerms = [
    "artifact",
    "artefato",
    "poor focus",
    "smear artifact",
    "degenerative cell",
    "cell distortion",
  ];

  const artifactHits =
    countMatches(
      text,
      artifactTerms,
    );

  if (artifactHits >= 2) {
    scores.artifactPattern += artifactHits * 2;

    reasoning.push(
      "Possíveis artefatos microscópicos identificados.",
    );
  }

  // ==========================================================================
  // FINAL OVERCALL SUPPRESSION — V5
  // ==========================================================================

  if (
    scores.blast > 0 &&
    scores.neoplasticPattern === 0 &&
    blastCriteria < 2
  ) {
    contradictionFlags.push(
      "Critérios insuficientes para suspeita blástica robusta.",
    );

    scores.blast =
      Math.max(
        0,
        scores.blast - 4,
      );

    scores.immatureFeatures =
      Math.max(
        0,
        scores.immatureFeatures - 2,
      );
  }

  if (
    normalLeukocytePattern &&
    blastCriteria < 3
  ) {
    scores.blast = 0;
    scores.immatureFeatures = 0;
    scores.neoplasticPattern = 0;
  }

  // ==========================================================================
  // PRIMARY / SECONDARY PATTERN
  // ==========================================================================

  const {
    primaryPattern,
    secondaryPattern,
  } = detectPatterns(scores);

  // ==========================================================================
  // IMMATURE FEATURE FLAG
  // ==========================================================================

  const immatureFeaturesDetected =
    scores.immatureFeatures >= 2 &&
    blastCriteria >= 2 &&
    !noLeukocytesDetected &&
    !normalLeukocytePattern;

  // ==========================================================================
  // BLAST RISK
  // ==========================================================================

  const blastRisk =
    classifyBlastRisk(
      scores.blast,
    );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  const leukocyteSummary =
    buildSummary(
      findings,
      noLeukocytesDetected,
      normalLeukocytePattern,
    );

  // ==========================================================================
  // RETURN
  // ==========================================================================

    return {
      leukocyteFindings: findings,
      leukocyteAlerts: unique(alerts),
      leukocyteCorrelations: unique(correlations),
      leukocyteReasoning: unique(reasoning),
      contradictionFlags: unique(contradictionFlags),

      leukocyteSummary:
        strongReactivePattern
          ? 'Linfócitos com características reacionais/ativadas, compatíveis com resposta imunológica. Ausência de critérios morfológicos inequívocos para blastos.'
          : leukocyteSummary,

      primaryPattern:
        strongReactivePattern
          ? 'Padrão linfocitário reacional'
          : primaryPattern,

      secondaryPattern,

      dominantPattern:
        strongReactivePattern
          ? 'Padrão linfocitário reacional'
          : primaryPattern,

      reactivePatternDetected: strongReactivePattern,
      immatureFeaturesDetected,
      leukocyteScores: scores,
      blastRisk,
    };
  }

// ============================================================================
// NORMALIZE
// ============================================================================

function normalizeText(
  text = "",
) {
  return String(text)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();
}

// ============================================================================
// NEGATION-AWARE CONTAINS
// ============================================================================

function containsAny(
  text,
  keywords = [],
) {
  return keywords.some(
    keyword =>
      text.includes(
        normalizeText(keyword),
      ),
  );
}

// ============================================================================
// NEGATION-AWARE COUNT MATCHES
// ============================================================================

function countMatches(
  text,
  keywords = [],
) {
  let count = 0;

  const negativePatterns = [
    "not observed",
    "not detected",
    "none observed",
    "absent",
    "nao observado",
    "nao observados",
    "nao observada",
    "nao observadas",
    "não observado",
    "não observados",
    "não observada",
    "não observadas",
    "sem evidencia",
    "sem evidência",
    "sem suspeita",
    "without evidence",
  ];

  for (const keyword of keywords) {
    const normalizedKeyword =
      normalizeText(keyword);

    let index =
      text.indexOf(
        normalizedKeyword,
      );

    while (index !== -1) {
      const context =
        text.slice(
          Math.max(0, index - 50),
          index +
            normalizedKeyword.length +
            50,
        );

      const negated =
        negativePatterns.some(
          negative =>
            context.includes(
              normalizeText(negative),
            ),
        );

      if (!negated) {
        count++;
      }

      index =
        text.indexOf(
          normalizedKeyword,
          index + 1,
        );
    }
  }

  return count;
}

// ============================================================================
// POSITIVE FINDING WITH NEGATION WINDOW
// ============================================================================

function hasPositiveFinding(
  text = "",
  keywords = [],
) {
  const negativePatterns = [
    "not observed",
    "not detected",
    "none observed",
    "absent",
    "nao observado",
    "nao observados",
    "nao observada",
    "nao observadas",
    "não observado",
    "não observados",
    "não observada",
    "não observadas",
    "sem evidencia",
    "sem evidência",
    "sem suspeita",
    "without evidence",
  ];

  for (const keyword of keywords) {
    const normalizedKeyword =
      normalizeText(keyword);

    let index =
      text.indexOf(
        normalizedKeyword,
      );

    while (index !== -1) {
      const context =
        text.slice(
          Math.max(0, index - 55),
          index +
            normalizedKeyword.length +
            55,
        );

      const negated =
        negativePatterns.some(
          negative =>
            context.includes(
              normalizeText(negative),
            ),
        );

      if (!negated) {
        return true;
      }

      index =
        text.indexOf(
          normalizedKeyword,
          index + 1,
        );
    }
  }

  return false;
}

// ============================================================================
// BLAST CONFIDENCE
// ============================================================================

function calculateBlastConfidence(
  text,
  criteria = 0,
) {
  let confidence = 10;

  if (
    hasPositiveFinding(
      text,
      [
        "nucleoli",
        "nucleolos",
        "nucleolo",
      ],
    )
  ) {
    confidence += 20;
  }

  if (
    hasPositiveFinding(
      text,
      [
        "high nucleus cytoplasm ratio",
        "alta relacao nucleo citoplasma",
        "high n/c ratio",
        "high nc ratio",
      ],
    )
  ) {
    confidence += 20;
  }

  if (
    hasPositiveFinding(
      text,
      [
        "fine chromatin",
        "open chromatin",
        "chromatina frouxa",
        "cromatina frouxa",
      ],
    )
  ) {
    confidence += 20;
  }

  confidence += criteria * 8;

  return Math.min(
    confidence,
    100,
  );
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

function detectPatterns(
  scores = {},
) {
  if (
    scores.blast <= 0 &&
    scores.leftShift <= 0 &&
    scores.toxicChanges <= 0 &&
    scores.hypersegmentation <= 0 &&
    scores.dysplasia <= 0
  ) {
    return {
      primaryPattern: "normal_pattern",
      secondaryPattern: null,
    };
  }

  const priority = {
    blast: scores.blast,
    leftShift: scores.leftShift,
    toxicChanges: scores.toxicChanges,
    hypersegmentation: scores.hypersegmentation,
    reactivePattern: scores.reactivePattern,
    dysplasia: scores.dysplasia,
  };

  const ordered =
    Object.entries(priority)
      .filter((entry) => entry[1] > 0)
      .sort((a, b) => b[1] - a[1]);

  if (ordered.length === 0) {
    return {
      primaryPattern: "normal_pattern",
      secondaryPattern: null,
    };
  }

  return {
    primaryPattern: ordered?.[0]?.[0] || "normal_pattern",
    secondaryPattern: ordered?.[1]?.[0] || null,
  };
}

// ============================================================================
// BLAST RISK
// ============================================================================

function classifyBlastRisk(
  score = 0,
) {
  if (score >= 16) return "high";
  if (score >= 10) return "moderate";
  if (score >= 6) return "minimal";
  return "low";
}

// ============================================================================
// UNIQUE
// ============================================================================

function unique(
  arr = [],
) {
  return [...new Set(arr)];
}

// ============================================================================
// SUMMARY
// ============================================================================

function buildSummary(
  findings = [],
  noLeukocytesDetected = false,
  normalLeukocytePattern = false,
) {
  if (noLeukocytesDetected) {
    return "Ausência de elementos leucocitários suficientes para avaliação morfológica confiável.";
  }

  if (normalLeukocytePattern && findings.length === 0) {
    return "Leucócitos descritos sem alterações morfológicas significativas.";
  }

  if (findings.length === 0) {
    return "Sem alterações leucocitárias significativas.";
  }

  return findings
    .map(
      item =>
        item.type.replaceAll(
          "_",
          " ",
        ),
    )
    .join(", ");
}