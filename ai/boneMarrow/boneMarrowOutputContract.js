export const BONE_MARROW_CONTRACT_VERSION = "CI-001B.3-v1";
export const MARROW_BLAST_POPULATION_CONTRACT_VERSION = "BE-FIX-005.24";
export const MARROW_PRECURSOR_DISCRIMINATION_CONTRACT_VERSION = "BE-FIX-005.27";
export const MARROW_DUAL_AXIS_BLAST_SCORING_CONTRACT_VERSION = "BE-FIX-005.27.2";
export const MARROW_BLAST_EVIDENCE_RECONCILIATION_CONTRACT_VERSION = "BE-FIX-005.28";

export const MarrowObservationStatus = Object.freeze({
  present: "present",
  notObserved: "notObserved",
  notAssessable: "notAssessable",
  indeterminate: "indeterminate",
});

const MARROW_TYPES = new Set([
  "BONE_MARROW_ASPIRATE",
  "BONE_MARROW_BIOPSY",
  "HEMODILUTED_BONE_MARROW",
]);

function isObject(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value),
  );
}

function asText(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function normalizeStatus(value, fallback = MarrowObservationStatus.indeterminate) {
  const text = asText(value).toLowerCase();

  if (
    [
      "present",
      "presente",
      "observed",
      "observado",
      "detected",
      "detectado",
      "seen",
      "visualizado",
    ].includes(text)
  ) {
    return MarrowObservationStatus.present;
  }

  if (
    [
      "notobserved",
      "not_observed",
      "não observado",
      "nao observado",
      "not seen",
      "não visualizado",
      "nao visualizado",
    ].includes(text)
  ) {
    return MarrowObservationStatus.notObserved;
  }

  if (
    [
      "notassessable",
      "not_assessable",
      "não avaliável",
      "nao avaliavel",
      "inadequate",
      "insufficient",
      "limitado",
      "limited",
    ].includes(text)
  ) {
    return MarrowObservationStatus.notAssessable;
  }

  return fallback;
}

function inferStatus(value, fallback = MarrowObservationStatus.indeterminate) {
  if (isObject(value)) {
    return normalizeStatus(
      value.status ??
      value.state ??
      value.observationStatus ??
      value.assessmentStatus,
      fallback,
    );
  }

  if (typeof value === "string") {
    return normalizeStatus(value, fallback);
  }

  if (value === true) {
    return MarrowObservationStatus.present;
  }

  if (value === false) {
    return MarrowObservationStatus.notObserved;
  }

  return fallback;
}

function extractSummary(value, fallback) {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (isObject(value)) {
    return asText(
      value.summary ??
      value.interpretation ??
      value.description ??
      value.finding ??
      value.overview ??
      value.conclusion,
      fallback,
    );
  }

  return fallback;
}

function preserveObject(value) {
  return isObject(value) ? { ...value } : {};
}

function normalizeAssessment(value, {
  fallbackSummary,
  status = MarrowObservationStatus.indeterminate,
  extra = {},
} = {}) {
  const original = preserveObject(value);

  return {
    ...original,
    status: inferStatus(value, status),
    summary: extractSummary(value, fallbackSummary),
    ...extra,
  };
}

function normalizeSeries(value, label) {
  const original = preserveObject(value);
  const status = inferStatus(
    value,
    MarrowObservationStatus.notAssessable,
  );

  return {
    ...original,
    status,
    assessable:
      original.assessable === true ||
      status === MarrowObservationStatus.present,
    lineage: label,
    maturation:
      asText(
        original.maturation ??
        original.maturationPattern,
        "Não avaliável com segurança no campo fornecido.",
      ),
    dysplasia:
      asText(
        original.dysplasia ??
        original.dysplasticFeatures,
        "Não avaliável com segurança no campo fornecido.",
      ),
    summary:
      extractSummary(
        value,
        `${label}: avaliação limitada ao campo enviado.`,
      ),
  };
}

function normalizeLimitations(...values) {
  const output = [];

  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = asText(item);
        if (text) output.push(text);
      }
      continue;
    }

    const text = asText(value);
    if (text) output.push(text);
  }

  output.push(
    "A interpretação está limitada às imagens e aos campos fornecidos.",
    "Ausência de achado no campo não equivale à ausência global na medula óssea.",
  );

  return [...new Set(output)];
}

function sourceValue(result, rawResult, key) {
  return (
    result?.[key] ??
    rawResult?.[key] ??
    result?.rawResponse?.[key] ??
    null
  );
}

function sanitizeMarrowLanguage(value) {
  const forbidden = [
    /esfregaço de sangue periférico normal/gi,
    /esfregaço sanguíneo normal/gi,
    /hemácias normocíticas e normocrômicas/gi,
    /eritrócitos normocíticos e normocrômicos/gi,
    /plaquetas (presentes )?em quantidade adequada/gi,
    /morfologia periférica preservada/gi,
    /ausência de blastos\b/gi,
    /sem blastos\b/gi,
    /sem displasia\b/gi,
    /medula normal\b/gi,
    /maturação preservada\b/gi,
  ];

  const replacement =
    "O campo medular não permite conclusão global; o achado deve ser interpretado conforme representatividade e limitações da amostra.";

  const walk = (current) => {
    if (Array.isArray(current)) {
      return current.map(walk);
    }

    if (isObject(current)) {
      const cloned = {};
      for (const [key, item] of Object.entries(current)) {
        cloned[key] = walk(item);
      }
      return cloned;
    }

    if (typeof current !== "string") {
      return current;
    }

    let text = current;
    for (const pattern of forbidden) {
      text = text.replace(pattern, replacement);
    }
    return text;
  };

  return walk(value);
}

export function enforceBoneMarrowOutputContract(
  result = {},
  {
    rawResult = {},
    specimenGate = {},
  } = {},
) {
  const safe = isObject(result) ? { ...result } : {};
  const raw = isObject(rawResult) ? rawResult : {};

  const specimenType =
    asText(
      specimenGate.specimenType ??
      safe.specimenType ??
      safe.specimenDecision?.effectiveType,
      "BONE_MARROW_ASPIRATE",
    ).toUpperCase();

  if (!MARROW_TYPES.has(specimenType)) {
    return safe;
  }

  const hemodiluted =
    specimenType === "HEMODILUTED_BONE_MARROW";

  const specimenAssessment = normalizeAssessment(
    sourceValue(safe, raw, "specimenAssessment"),
    {
      fallbackSummary:
        "Material classificado como medula óssea; interpretação limitada aos campos enviados.",
      status: MarrowObservationStatus.present,
      extra: {
        specimenType,
        material:
          specimenType === "BONE_MARROW_BIOPSY"
            ? "Biópsia de medula óssea"
            : "Aspirado de medula óssea",
      },
    },
  );

  const marrowAdequacy = normalizeAssessment(
    sourceValue(safe, raw, "marrowAdequacy"),
    {
      fallbackSummary:
        "Adequação técnica e representatividade devem ser avaliadas separadamente.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        technicalQuality:
          asText(
            sourceValue(safe, raw, "marrowAdequacy")?.technicalQuality,
            "Não informada.",
          ),
        representativity:
          asText(
            sourceValue(safe, raw, "marrowAdequacy")?.representativity,
            "Não avaliável com segurança no campo isolado.",
          ),
      },
    },
  );

  const spiculeAssessment = normalizeAssessment(
    sourceValue(safe, raw, "spiculeAssessment"),
    {
      fallbackSummary:
        "Espículas não podem ser confirmadas ou excluídas globalmente pelo campo isolado.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        observed:
          sourceValue(safe, raw, "spiculeAssessment")?.observed ?? null,
      },
    },
  );

  const hemodilutionAssessment = normalizeAssessment(
    sourceValue(safe, raw, "hemodilutionAssessment"),
    {
      fallbackSummary: hemodiluted
        ? "Hemodiluição reconhecida pelo classificador; representatividade medular reduzida."
        : "Hemodiluição não pode ser determinada com segurança apenas pelo campo fornecido.",
      status: hemodiluted
        ? MarrowObservationStatus.present
        : MarrowObservationStatus.notAssessable,
      extra: {
        suspected:
          hemodiluted ||
          sourceValue(safe, raw, "hemodilutionAssessment")?.suspected === true,
      },
    },
  );

  const cellularityAssessment = normalizeAssessment(
    sourceValue(safe, raw, "cellularityAssessment"),
    {
      fallbackSummary:
        "A celularidade global não pode ser estimada com segurança a partir de campo isolado ou não representativo.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        scope: "field_limited",
        globalEstimateAllowed: false,
        estimate:
          asText(
            sourceValue(safe, raw, "cellularityAssessment")?.estimate,
            "",
          ) || null,
      },
    },
  );

  const blastAssessment = normalizeAssessment(
    sourceValue(safe, raw, "blastAssessment"),
    {
      fallbackSummary:
        "Blastos inequívocos não foram confirmados no campo analisado; ausência global não pode ser afirmada.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        observed:
          sourceValue(safe, raw, "blastAssessment")?.observed ?? null,
        estimatedPercentage:
          sourceValue(safe, raw, "blastAssessment")?.estimatedPercentage ??
          sourceValue(safe, raw, "blastAssessment")?.percentage ??
          null,
        globalAbsenceAllowed: false,
        evidenceState:
          asText(
            sourceValue(safe, raw, "blastAssessment")?.evidenceState,
            "NOT_ASSESSABLE",
          ).toUpperCase(),
        approximateBlastLikeCells:
          sourceValue(safe, raw, "blastAssessment")?.approximateBlastLikeCells ??
          sourceValue(safe, raw, "blastAssessment")?.observedBlastLikeCount ??
          null,
        approximateImmatureCellCount:
          sourceValue(safe, raw, "blastAssessment")?.approximateImmatureCellCount ??
          null,
        immatureCellBurden:
          asText(sourceValue(safe, raw, "blastAssessment")?.immatureCellBurden, "indeterminate"),
        spatialDistribution:
          asText(sourceValue(safe, raw, "blastAssessment")?.spatialDistribution, "indeterminate"),
        morphologicFeatureCount:
          sourceValue(safe, raw, "blastAssessment")?.morphologicFeatureCount ?? null,
        populationPattern:
          asText(
            sourceValue(safe, raw, "blastAssessment")?.populationPattern,
            "indeterminate",
          ),
        morphologySupport: {
          ...(isObject(sourceValue(safe, raw, "blastAssessment")?.morphologySupport)
            ? sourceValue(safe, raw, "blastAssessment").morphologySupport
            : {}),
        },
        precursorContext: {
          ...(isObject(sourceValue(safe, raw, "blastAssessment")?.precursorContext)
            ? sourceValue(safe, raw, "blastAssessment").precursorContext
            : {}),
        },
        blastoidSubpopulationContext: {
          ...(isObject(sourceValue(safe, raw, "blastAssessment")?.blastoidSubpopulationContext)
            ? sourceValue(safe, raw, "blastAssessment").blastoidSubpopulationContext
            : {}),
        },
        precursorDiscriminationVersion:
          MARROW_PRECURSOR_DISCRIMINATION_CONTRACT_VERSION,
        dualAxisBlastScoringVersion:
          MARROW_DUAL_AXIS_BLAST_SCORING_CONTRACT_VERSION,
        dualAxisBlastScoring: {
          ...(isObject(sourceValue(safe, raw, "blastAssessment")?.dualAxisBlastScoring)
            ? sourceValue(safe, raw, "blastAssessment").dualAxisBlastScoring
            : {}),
        },
        evidenceReconciliation: {
          ...(isObject(sourceValue(safe, raw, "blastAssessment")?.evidenceReconciliation)
            ? sourceValue(safe, raw, "blastAssessment").evidenceReconciliation
            : {}),
        },
        acquisitionEvidenceConflict:
          sourceValue(safe, raw, "blastAssessment")?.acquisitionEvidenceConflict === true,
        structuredNarrativeDiscordance:
          sourceValue(safe, raw, "blastAssessment")?.structuredNarrativeDiscordance === true,
        reconciledFromObservationNarrative:
          sourceValue(safe, raw, "blastAssessment")?.reconciledFromObservationNarrative === true,
        reconciliationVersion:
          asText(sourceValue(safe, raw, "blastAssessment")?.reconciliationVersion, MARROW_BLAST_EVIDENCE_RECONCILIATION_CONTRACT_VERSION),
        lineageAssignable: false,
        lineage: "indeterminate",
        diagnosticLabelProhibited: true,
        governanceVersion: MARROW_BLAST_POPULATION_CONTRACT_VERSION,
      },
    },
  );

  const plasmaCellAssessment = normalizeAssessment(
    sourceValue(safe, raw, "plasmaCellAssessment"),
    {
      fallbackSummary:
        "Plasmócitos não podem ser quantificados globalmente pelo campo isolado.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        estimatedPercentage:
          sourceValue(safe, raw, "plasmaCellAssessment")?.estimatedPercentage ??
          null,
      },
    },
  );

  const dysplasiaAssessment = normalizeAssessment(
    sourceValue(safe, raw, "dysplasiaAssessment"),
    {
      fallbackSummary:
        "Displasia não pode ser confirmada nem excluída globalmente pelo campo isolado.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        globalExclusionAllowed: false,
      },
    },
  );

  const infiltrationAssessment = normalizeAssessment(
    sourceValue(safe, raw, "infiltrationAssessment"),
    {
      fallbackSummary:
        "Infiltração não pode ser confirmada nem excluída globalmente apenas pelo campo fornecido.",
      status: MarrowObservationStatus.notAssessable,
      extra: {
        globalExclusionAllowed: false,
      },
    },
  );

  const marrowLimitations = normalizeLimitations(
    safe.marrowLimitations,
    raw.marrowLimitations,
    hemodiluted
      ? "Hemodiluição reduz a representatividade dos compartimentos medulares."
      : "",
  );

  const contracted = {
    ...safe,
    specimenType,
    specimenAssessment,
    marrowAdequacy,
    spiculeAssessment,
    hemodilutionAssessment,
    cellularityAssessment,
    myeloidSeries:
      normalizeSeries(
        sourceValue(safe, raw, "myeloidSeries"),
        "Série mieloide",
      ),
    erythroidSeries:
      normalizeSeries(
        sourceValue(safe, raw, "erythroidSeries"),
        "Série eritroide",
      ),
    megakaryocyticSeries:
      normalizeSeries(
        sourceValue(safe, raw, "megakaryocyticSeries"),
        "Série megacariocítica",
      ),
    plasmaCellAssessment,
    blastAssessment,
    dysplasiaAssessment,
    infiltrationAssessment,
    marrowLimitations,
    boneMarrowOutputContract: {
      version: BONE_MARROW_CONTRACT_VERSION,
      complete: true,
      triState:
        Object.values(MarrowObservationStatus),
      requiredFields: [
        "specimenAssessment",
        "marrowAdequacy",
        "spiculeAssessment",
        "hemodilutionAssessment",
        "cellularityAssessment",
        "myeloidSeries",
        "erythroidSeries",
        "megakaryocyticSeries",
        "plasmaCellAssessment",
        "blastAssessment",
        "dysplasiaAssessment",
        "infiltrationAssessment",
        "marrowLimitations",
      ],
    },
    normalityBlocked: true,
    requiresHumanReview: true,
    overallAssessment: {
      ...(isObject(safe.overallAssessment)
        ? safe.overallAssessment
        : {}),
      requiresHumanReview: true,
      specimenSpecificReview: "bone_marrow",
    },
    blockNormalReason: [
      ...new Set([
        ...(Array.isArray(safe.blockNormalReason)
          ? safe.blockNormalReason
          : []),
        "Material medular exige avaliação de representatividade e revisão especializada.",
        ...(
          hemodiluted
            ? ["Hemodiluição limita conclusões globais."]
            : []
        ),
      ]),
    ],
  };

  return sanitizeMarrowLanguage(contracted);
}
