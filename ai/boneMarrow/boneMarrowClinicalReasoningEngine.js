import {
  BONE_MARROW_CONTRACT_VERSION,
  MarrowObservationStatus,
} from "./boneMarrowOutputContract.js";

export const BONE_MARROW_REASONING_VERSION = "CI-001B.4-v1";
export const MARROW_BLAST_POPULATION_REASONING_VERSION = "BE-FIX-005.24";

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

function text(value, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return fallback;
}

function list(value) {
  return Array.isArray(value)
    ? value
        .map((item) => text(item))
        .filter(Boolean)
    : [];
}

function statusOf(
  value,
  fallback = MarrowObservationStatus.indeterminate,
) {
  const status =
    isObject(value)
      ? text(value.status)
      : "";

  return Object
    .values(MarrowObservationStatus)
    .includes(status)
      ? status
      : fallback;
}

function containsAny(value, terms) {
  const normalized =
    JSON.stringify(value || {})
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return terms.some(
    (term) =>
      normalized.includes(
        term
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""),
      ),
  );
}

function unique(...values) {
  return [
    ...new Set(
      values
        .flat(Infinity)
        .map((item) => text(item))
        .filter(Boolean),
    ),
  ];
}

function buildAdequacyReasoning(result) {
  const adequacy = result.marrowAdequacy || {};
  const spicules = result.spiculeAssessment || {};
  const hemodilution =
    result.hemodilutionAssessment || {};

  const limitations = [];
  const supportingEvidence = [];

  const adequacyStatus =
    statusOf(
      adequacy,
      MarrowObservationStatus.notAssessable,
    );

  const spiculeStatus =
    statusOf(
      spicules,
      MarrowObservationStatus.notAssessable,
    );

  const hemodilutionStatus =
    statusOf(
      hemodilution,
      MarrowObservationStatus.notAssessable,
    );

  if (
    adequacyStatus ===
    MarrowObservationStatus.present
  ) {
    supportingEvidence.push(
      "Há informação estruturada sobre adequação da amostra.",
    );
  } else {
    limitations.push(
      "A adequação global da amostra não pode ser estabelecida com segurança.",
    );
  }

  if (
    spiculeStatus ===
    MarrowObservationStatus.present ||
    spicules.observed === true
  ) {
    supportingEvidence.push(
      "Espículas ou fragmentos medulares foram descritos no material analisado.",
    );
  } else if (
    spiculeStatus ===
    MarrowObservationStatus.notObserved
  ) {
    limitations.push(
      "Espículas não foram observadas no campo enviado; isso não exclui origem medular.",
    );
  } else {
    limitations.push(
      "A presença de espículas não pôde ser avaliada de forma conclusiva.",
    );
  }

  const hemodilutionSuspected =
    hemodilution.suspected === true ||
    hemodilutionStatus ===
      MarrowObservationStatus.present ||
    result.specimenType ===
      "HEMODILUTED_BONE_MARROW";

  if (hemodilutionSuspected) {
    limitations.push(
      "Hemodiluição pode reduzir a representatividade das linhagens e distorcer estimativas celulares.",
    );
  }

  const assessable =
    adequacyStatus ===
      MarrowObservationStatus.present &&
    !hemodilutionSuspected;

  return {
    assessable,
    status: assessable
      ? "adequate_with_limitations"
      : "limited_or_indeterminate",
    supportingEvidence:
      unique(supportingEvidence),
    limitations:
      unique(limitations),
    interpretation: assessable
      ? "A amostra contém elementos úteis para avaliação morfológica, porém as conclusões permanecem limitadas aos campos enviados."
      : "A representatividade é limitada ou indeterminada; conclusões globais sobre a medula exigem revisão de múltiplos campos e correlação técnica.",
  };
}

function buildCellularityReasoning(result) {
  const assessment =
    result.cellularityAssessment || {};

  const status =
    statusOf(
      assessment,
      MarrowObservationStatus.notAssessable,
    );

  const globalEstimateAllowed =
    assessment.globalEstimateAllowed === true;

  const estimate =
    text(assessment.estimate) || null;

  const canEstimate =
    status ===
      MarrowObservationStatus.present &&
    globalEstimateAllowed &&
    Boolean(estimate);

  return {
    status,
    estimate:
      canEstimate
        ? estimate
        : null,
    fieldLevelDescription:
      text(
        assessment.summary,
        "A celularidade observada deve ser descrita apenas no nível do campo.",
      ),
    globalEstimateAllowed,
    interpretation:
      canEstimate
        ? `Estimativa de celularidade registrada: ${estimate}. Deve ser confirmada em material representativo.`
        : "A celularidade global não pode ser estimada com segurança a partir do campo isolado ou não representativo.",
    limitations:
      canEstimate
        ? [
            "A estimativa permanece dependente da representatividade do aspirado e da avaliação de múltiplos campos.",
          ]
        : [
            "Não converter celularidade aparente do campo em celularidade global da medula.",
          ],
  };
}

function buildLineageReasoning(
  assessment,
  lineage,
) {
  const safe =
    isObject(assessment)
      ? assessment
      : {};

  const status =
    statusOf(
      safe,
      MarrowObservationStatus.notAssessable,
    );

  const assessable =
    safe.assessable === true ||
    status ===
      MarrowObservationStatus.present;

  return {
    lineage,
    status,
    assessable,
    maturation:
      text(
        safe.maturation,
        "Não avaliável com segurança.",
      ),
    dysplasia:
      text(
        safe.dysplasia,
        "Não avaliável com segurança.",
      ),
    summary:
      text(
        safe.summary,
        `${lineage}: avaliação limitada ao campo enviado.`,
      ),
    interpretation: assessable
      ? `${lineage} contém elementos avaliáveis no campo, sem permitir extrapolação automática para toda a medula.`
      : `${lineage} não é avaliável com segurança no material fornecido.`,
    globalPreservationAllowed: false,
  };
}

function buildBlastReasoning(result) {
  const assessment =
    result.blastAssessment || {};

  const status =
    statusOf(
      assessment,
      MarrowObservationStatus.notAssessable,
    );

  const observed =
    assessment.observed === true ||
    status ===
      MarrowObservationStatus.present ||
    result.findings?.blastSuspicion === true ||
    result.findings?.immatureCells === true;

  const estimatedPercentage =
    Number.isFinite(
      Number(
        assessment.estimatedPercentage,
      ),
    )
      ? Number(
          assessment.estimatedPercentage,
        )
      : null;

  const evidenceTerms = [
    "blasto",
    "blast",
    "célula imatura",
    "celula imatura",
    "cromatina frouxa",
    "nucléolo",
    "nucleolo",
    "auer",
  ];

  const morphologicSignal =
    containsAny(
      {
        assessment,
        findings: result.findings,
        morphology:
          result.morphologyAnalysis,
        raw: result.rawResponse,
      },
      evidenceTerms,
    );

  const evidenceState =
    text(assessment.evidenceState, "NOT_ASSESSABLE").toUpperCase();

  const approximateBlastLikeCells =
    Number.isFinite(Number(assessment.approximateBlastLikeCells))
      ? Math.max(0, Math.trunc(Number(assessment.approximateBlastLikeCells)))
      : null;

  const populationPattern =
    text(assessment.populationPattern, "indeterminate").toLowerCase();

  const morphologySupport =
    isObject(assessment.morphologySupport)
      ? { ...assessment.morphologySupport }
      : {};

  const morphologySupportCount =
    Object.values(morphologySupport).filter((value) => value === true).length;

  const repeatedPopulation =
    populationPattern === "repeated" ||
    populationPattern === "dominant" ||
    morphologySupport.repeatedAcrossField === true ||
    (approximateBlastLikeCells !== null && approximateBlastLikeCells >= 3);

  const observedPopulation =
    evidenceState === "OBSERVED_POPULATION" &&
    repeatedPopulation &&
    morphologySupportCount >= 2;

  const suspiciousPopulation =
    evidenceState === "SUSPICIOUS_POPULATION" ||
    (!observedPopulation && repeatedPopulation && morphologySupportCount >= 2);

  const concern =
    observedPopulation ||
    suspiciousPopulation ||
    observed ||
    result.findings?.monomorphicPopulation === true ||
    morphologicSignal &&
      result.findings?.blastSuspicion === true;

  return {
    status,
    observed:
      observed
        ? true
        : null,
    estimatedPercentage,
    evidenceState,
    approximateBlastLikeCells,
    populationPattern,
    morphologySupport,
    morphologySupportCount,
    repeatedPopulation,
    observedPopulation,
    suspiciousPopulation,
    findingFirstPriority:
      observedPopulation ? "CRITICAL" : suspiciousPopulation ? "HIGH" : "REVIEW",
    lineageAssignable: false,
    diagnosticLabelProhibited: true,
    governanceVersion: MARROW_BLAST_POPULATION_REASONING_VERSION,
    concern,
    confidence:
      concern
        ? "moderate_or_indeterminate"
        : "low_for_global_exclusion",
    supportingEvidence:
      concern
        ? [
            "Há sinal morfológico ou estruturado que exige revisão para células imaturas/blásticas.",
          ]
        : [],
    limitations: [
      "A ausência de blastos no campo não permite exclusão global.",
      "Estimativa percentual exige contagem representativa em múltiplos campos.",
    ],
    interpretation: observedPopulation
      ? "População blastoide/imatura morfologicamente observada no campo medular. A limitação de representatividade não invalida o achado positivo; requer revisão hematológica urgente e caracterização complementar, sem atribuição de linhagem pela imagem isolada."
      : suspiciousPopulation
        ? "Há suspeita sustentada de população blastoide/imatura no campo medular. A representatividade limita quantificação global, mas não apaga a suspeita; requer revisão hematológica prioritária."
        : concern
          ? "Há suspeita morfológica de células imaturas/blásticas; requer revisão hematológica especializada e correlação com métodos complementares."
          : "Blastos inequívocos não foram confirmados no campo, mas a ausência global não pode ser afirmada.",
    globalAbsenceAllowed: false,
  };
}

function buildPlasmaCellReasoning(result) {
  const assessment =
    result.plasmaCellAssessment || {};

  const status =
    statusOf(
      assessment,
      MarrowObservationStatus.notAssessable,
    );

  const detected =
    status ===
      MarrowObservationStatus.present ||
    result.findings?.plasmocytes === true ||
    result.findings?.plasmablasts === true;

  const estimatedPercentage =
    Number.isFinite(
      Number(
        assessment.estimatedPercentage,
      ),
    )
      ? Number(
          assessment.estimatedPercentage,
        )
      : null;

  return {
    status,
    detected,
    estimatedPercentage,
    concern:
      result.findings?.plasmablasts === true ||
      Boolean(
        estimatedPercentage !== null &&
        estimatedPercentage >= 10,
      ),
    interpretation: detected
      ? "Plasmócitos foram descritos no material; quantidade, distribuição e atipia devem ser confirmadas em avaliação representativa."
      : "Plasmócitos não podem ser quantificados ou excluídos globalmente a partir do campo isolado.",
    limitations: [
      "A distribuição plasmocitária pode ser focal.",
      "Percentual confiável exige contagem representativa e correlação clínico-laboratorial.",
    ],
  };
}

function buildDysplasiaReasoning(result) {
  const assessment =
    result.dysplasiaAssessment || {};

  const status =
    statusOf(
      assessment,
      MarrowObservationStatus.notAssessable,
    );

  const lineageSignals = {
    myeloid:
      containsAny(
        result.myeloidSeries,
        [
          "displasia",
          "hipogranulação",
          "hipossegmentação",
          "pseudo-pelger",
        ],
      ),
    erythroid:
      containsAny(
        result.erythroidSeries,
        [
          "displasia",
          "megaloblast",
          "multinuclear",
          "ponte internuclear",
        ],
      ),
    megakaryocytic:
      containsAny(
        result.megakaryocyticSeries,
        [
          "displasia",
          "micromegacar",
          "hipolobulado",
          "núcleo separado",
          "nucleo separado",
        ],
      ),
  };

  const suspected =
    status ===
      MarrowObservationStatus.present ||
    Object.values(lineageSignals)
      .some(Boolean);

  return {
    status,
    suspected,
    lineageSignals,
    interpretation: suspected
      ? "Há sinais que podem corresponder a displasia em uma ou mais linhagens; requer confirmação em amostra representativa e correlação clínica."
      : "Displasia não foi confirmada no campo, porém não pode ser excluída globalmente.",
    limitations: [
      "A avaliação de displasia exige número adequado de células por linhagem.",
      "Artefatos de preparação e hemodiluição podem simular ou ocultar alterações.",
    ],
    globalExclusionAllowed: false,
  };
}

function buildInfiltrationReasoning(result) {
  const assessment =
    result.infiltrationAssessment || {};

  const status =
    statusOf(
      assessment,
      MarrowObservationStatus.notAssessable,
    );

  const signal =
    status ===
      MarrowObservationStatus.present ||
    containsAny(
      {
        assessment,
        morphology:
          result.morphologyAnalysis,
        findings: result.findings,
        raw: result.rawResponse,
      },
      [
        "infiltra",
        "população monomórfica",
        "populacao monomorfica",
        "células não hematopoéticas",
        "celulas nao hematopoeticas",
        "metast",
        "histioc",
        "parasita",
      ],
    );

  return {
    status,
    suspected: signal,
    interpretation: signal
      ? "Há sinal morfológico que pode representar padrão infiltrativo ou população anormal; requer revisão especializada e métodos complementares."
      : "Infiltração não foi confirmada no campo, mas não pode ser excluída globalmente.",
    limitations: [
      "Padrões infiltrativos podem ser focais.",
      "Imagem isolada não permite excluir infiltração medular.",
    ],
    globalExclusionAllowed: false,
  };
}

function classifyIntegratedConcern({
  adequacy,
  blast,
  plasma,
  dysplasia,
  infiltration,
  result,
}) {
  if (blast.concern) {
    return {
      level: "high_review_priority",
      category:
        "MARROW_IMMATURE_OR_BLAST_SUSPICION",
      label:
        "Suspeita de população imatura/blástica",
    };
  }

  if (
    infiltration.suspected ||
    dysplasia.suspected ||
    plasma.concern ||
    result.findings?.monomorphicPopulation === true
  ) {
    return {
      level: "specialist_review_required",
      category:
        "MARROW_ATYPICAL_OR_INFILTRATIVE_PATTERN",
      label:
        "Padrão medular atípico ou infiltrativo",
    };
  }

  if (!adequacy.assessable) {
    return {
      level: "limited",
      category:
        "MARROW_LIMITED_OR_NONREPRESENTATIVE",
      label:
        "Amostra medular limitada ou não representativa",
    };
  }

  return {
    level: "review_required",
    category:
      "MARROW_MORPHOLOGY_REVIEW",
    label:
      "Avaliação morfológica medular requer revisão",
  };
}

export function applyBoneMarrowClinicalReasoning(
  result = {},
  {
    specimenGate = {},
  } = {},
) {
  if (!isObject(result)) {
    return result;
  }

  const specimenType =
    text(
      specimenGate.specimenType ??
      result.specimenType ??
      result.specimenDecision?.effectiveType,
    ).toUpperCase();

  if (!MARROW_TYPES.has(specimenType)) {
    return result;
  }

  const adequacy =
    buildAdequacyReasoning(result);

  const cellularity =
    buildCellularityReasoning(result);

  const lineages = {
    myeloid:
      buildLineageReasoning(
        result.myeloidSeries,
        "Série mieloide",
      ),
    erythroid:
      buildLineageReasoning(
        result.erythroidSeries,
        "Série eritroide",
      ),
    megakaryocytic:
      buildLineageReasoning(
        result.megakaryocyticSeries,
        "Série megacariocítica",
      ),
  };

  const blast =
    buildBlastReasoning(result);

  const plasmaCells =
    buildPlasmaCellReasoning(result);

  const dysplasia =
    buildDysplasiaReasoning(result);

  const infiltration =
    buildInfiltrationReasoning(result);

  const integratedConcern =
    classifyIntegratedConcern({
      adequacy,
      blast,
      plasma: plasmaCells,
      dysplasia,
      infiltration,
      result,
    });

  const limitations =
    unique(
      result.marrowLimitations,
      adequacy.limitations,
      cellularity.limitations,
      blast.limitations,
      plasmaCells.limitations,
      dysplasia.limitations,
      infiltration.limitations,
    );

  const reasoning = {
    version:
      BONE_MARROW_REASONING_VERSION,
    contractVersion:
      result.boneMarrowOutputContract?.version ||
      BONE_MARROW_CONTRACT_VERSION,
    specimenType,
    adequacy,
    cellularity,
    lineages,
    blast,
    plasmaCells,
    dysplasia,
    infiltration,
    integratedConcern,
    limitations,
    explainability: {
      observed:
        unique(
          adequacy.supportingEvidence,
          blast.supportingEvidence,
          lineages.myeloid.summary,
          lineages.erythroid.summary,
          lineages.megakaryocytic.summary,
        ),
      inferred: unique(
        adequacy.interpretation,
        cellularity.interpretation,
        blast.interpretation,
        plasmaCells.interpretation,
        dysplasia.interpretation,
        infiltration.interpretation,
      ),
      cannotConfirm: unique(
        "Celularidade global da medula por campo isolado.",
        "Ausência global de blastos.",
        "Ausência global de displasia.",
        "Ausência global de infiltração.",
        "Relação mieloide/eritroide sem contagem representativa.",
      ),
    },
    finalInterpretation:
      `${integratedConcern.label}. ` +
      "A interpretação é educacional, limitada aos campos enviados e exige correlação com revisão microscópica profissional, dados clínicos e exames complementares.",
  };

  return {
    ...result,
    boneMarrowClinicalReasoning:
      reasoning,
    marrowReasoningVersion:
      BONE_MARROW_REASONING_VERSION,
    marrowClinicalCategory:
      integratedConcern.category,
    marrowClinicalPriority:
      integratedConcern.level,
    marrowLimitations:
      limitations,
    normalityBlocked: true,
    requiresHumanReview: true,
    overallAssessment: {
      ...(isObject(result.overallAssessment)
        ? result.overallAssessment
        : {}),
      requiresHumanReview: true,
      riskCategory:
        integratedConcern.category,
      mainImpression:
        reasoning.finalInterpretation,
    },
    structuredReport: {
      ...(isObject(result.structuredReport)
        ? result.structuredReport
        : {}),
      conclusion:
        reasoning.finalInterpretation,
      hematologicMeaning:
        integratedConcern.label,
      recommendation:
        "Revisão hematológica especializada, avaliação de múltiplos campos e correlação com hemograma, imunofenotipagem, citogenética ou outros métodos conforme indicação.",
    },
    blockNormalReason: unique(
      result.blockNormalReason,
      "Material medular não deve ser classificado globalmente como normal por imagem isolada.",
      ...(
        !adequacy.assessable
          ? [
              "Adequação ou representatividade insuficiente para conclusão global.",
            ]
          : []
      ),
      ...(
        blast.concern
          ? [
              "Suspeita de população imatura/blástica.",
            ]
          : []
      ),
      ...(
        dysplasia.suspected
          ? [
              "Sinais possíveis de displasia.",
            ]
          : []
      ),
      ...(
        infiltration.suspected
          ? [
              "Sinal possível de infiltração ou população anormal.",
            ]
          : []
      ),
    ),
  };
}
