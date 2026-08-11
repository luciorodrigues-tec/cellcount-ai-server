// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.1 — LOCAL MORPHOLOGY EVIDENCE CONTRACT (LME-1.0)
//
// Purpose
// -------
// Capture what is visually supported by the submitted microscopic field BEFORE
// adequacy/safety/governor layers alter interpretation. Representativity may
// constrain conclusions, but it must never become the morphology itself.
// ============================================================================

export const LOCAL_MORPHOLOGY_EVIDENCE_VERSION = "LME-1.0";

const GENERIC_LIMITATION_PATTERNS = [
  /campo microsc[oó]pico limitado/i,
  /campo limitado/i,
  /baixa representatividade/i,
  /representatividade (?:do campo )?(?:limitada|insuficiente)/i,
  /avalia[cç][aã]o .* limitada (?:ao campo|pela representatividade)/i,
  /n[aã]o (?:é|e) adequado afirmar .* global/i,
  /n[aã]o afirmar .* global/i,
  /n[aã]o permite caracteriza[cç][aã]o populacional confi[aá]vel/i,
  /n[aã]o permite conclus[aã]o hematol[oó]gica global/i,
  /n[aã]o permite exclus[aã]o global/i,
  /recomenda-se avalia[cç][aã]o de m[uú]ltiplos campos/i,
];

const CONCRETE_MORPHOLOGY_PATTERNS = [
  /anisocit/i,
  /poiquilocit/i,
  /microcit|macrocit|normocit/i,
  /hipocrom|normocrom|policrom/i,
  /esquiz[oó]cit|acant[oó]cit|equin[oó]cit|cod[oó]cit|drepan[oó]cit/i,
  /rouleaux|empilhamento/i,
  /cromatina/i,
  /nucl[eé]ol/i,
  /rela[cç][aã]o n[:\/]?c|n[uú]cleo.?citoplasma/i,
  /citoplasma/i,
  /granula[cç][aã]o|vacuol/i,
  /segmentad|lobulad/i,
  /linf[oó]cit|neutr[oó]fil|mon[oó]cit|eosin[oó]fil|bas[oó]fil/i,
  /reativ|at[ií]pic|imaturo|blasto/i,
  /macroplaquet|plaqueta(?:s)? (?:gigante|aumentad|espars|dispers)|agregad/i,
];

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : item))
    .filter((item) => item !== "" && item !== null && item !== undefined);
}

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function finiteNumber(value) {
  // BE-FIX-005.8: preserve UNKNOWN/NOT_ASSESSABLE. Null is not zero.
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function genericLimitationOnly(text) {
  const clean = asText(text);
  if (!clean) return false;

  const hits = GENERIC_LIMITATION_PATTERNS.filter((pattern) =>
    pattern.test(clean),
  ).length;

  if (hits === 0) return false;

  const hasConcreteMorphology = CONCRETE_MORPHOLOGY_PATTERNS.some((pattern) =>
    pattern.test(clean),
  );

  // BE-FIX-005.6: one pure adequacy sentence is already enough to reject the
  // value as morphology. If concrete cytomorphology is present in the same
  // text, retain it unless the narrative is overwhelmingly limitation-only.
  return !hasConcreteMorphology || hits >= 3;
}

function safeObservation(...values) {
  for (const value of values) {
    const text = asText(value);
    if (!text) continue;
    if (!genericLimitationOnly(text)) return text;
  }
  return "";
}

function normalizeTriState(value) {
  if (value === true) return "OBSERVED";
  if (value === false) return "NOT_OBSERVED_IN_EVALUABLE_FIELD";

  const text = asText(value).toLowerCase();
  if (!text) return "NOT_ASSESSABLE";

  if (/presente|observad|identificad|evidente/.test(text) &&
      !/n[aã]o|nao|ausente|sem/.test(text)) {
    return "OBSERVED";
  }

  if (/n[aã]o evid|nao evid|n[aã]o observ|nao observ|ausente/.test(text)) {
    return "NOT_OBSERVED_IN_EVALUABLE_FIELD";
  }

  return "NOT_ASSESSABLE";
}

function normalizeCriticalMorphology(explicit = {}, raw = {}) {
  const findings = asObject(raw.findings);
  const visual = asObject(raw.visualEvidence);

  return {
    blastLikeMorphology: normalizeTriState(
      explicit.blastLikeMorphology ??
        explicit.blastLikeMorphologyObserved ??
        findings.blastSuspicion,
    ),
    auerRod: normalizeTriState(
      explicit.auerRod ?? explicit.auerRodObserved ?? findings.auerRods,
    ),
    schistocytes: normalizeTriState(
      explicit.schistocytes ??
        explicit.schistocytesObserved ??
        findings.schistocytes,
    ),
    parasites: normalizeTriState(
      explicit.parasites ??
        explicit.parasitesObserved ??
        findings.parasiteSuspected,
    ),
    supportingBlastFeatures: {
      prominentNucleolus:
        visual.prominentNucleolus === true ? true : null,
      cellSizeIncrease:
        visual.cellSizeIncrease === true ? true : null,
      highNucleusCytoplasmRatio:
        visual.highNucleusCytoplasmRatio === true ? true : null,
      openOrFineChromatin:
        visual.openChromatin === true || visual.fineChromatin === true
          ? true
          : null,
    },
  };
}

export function createLocalMorphologyEvidence({
  visionResponse = {},
  analysisSource = "ai_visual",
} = {}) {
  const raw = asObject(visionResponse);
  const explicit = asObject(raw.localMorphologyEvidence);
  const legacy = asObject(raw.observedMorphology);
  const morphology = asObject(raw.morphologyAnalysis);
  const seeing = asObject(raw.whatAISees);
  const fieldAdequacy = asObject(raw.fieldAdequacy);

  const explicitField = asObject(explicit.field);
  const explicitRbc = asObject(explicit.erythrocytes);
  const explicitWbc = asObject(explicit.leukocytes);
  const explicitPlt = asObject(explicit.platelets);
  const explicitAcademic = asObject(explicit.academicReasoning);
  const legacyRbc = asObject(legacy.erythrocytes);
  const legacyWbc = asObject(legacy.leukocytes);
  const legacyPlt = asObject(legacy.platelets);
  const legacyAcademic = asObject(raw.academicInterpretation);
  const hematologicReasoning = asObject(raw.hematologicReasoning);

  const fieldDescription = safeObservation(
    explicitField.description,
    legacy.globalField,
    seeing.globalField,
    morphology.overview,
  );

  const erythrocyteDescription = safeObservation(
    explicitRbc.description,
    legacyRbc.description,
    seeing.erythrocytes,
    morphology.erythrocyteReview,
  );

  const leukocyteDescription = safeObservation(
    explicitWbc.description,
    legacyWbc.description,
    seeing.leukocytes,
    morphology.leukocyteReview,
  );

  const plateletDescription = safeObservation(
    explicitPlt.description,
    legacyPlt.description,
    seeing.platelets,
    morphology.plateletReview,
  );

  const positiveEvidence = [
    ...asArray(explicit.positiveEvidence),
    ...asArray(legacy.positiveEvidence),
    ...asArray(raw.positiveFindings),
    ...asArray(seeing.positiveFindings),
  ];

  const uncertainties = [
    ...asArray(explicit.uncertainties),
    ...asArray(explicit.uncertainty),
    ...asArray(legacy.uncertainty),
  ];

  const evidenceAvailable = Boolean(
    fieldDescription ||
      erythrocyteDescription ||
      leukocyteDescription ||
      plateletDescription ||
      positiveEvidence.length > 0,
  );

  const observedCellCount =
    finiteNumber(explicitWbc.observedCellCount) ??
    finiteNumber(explicitWbc.approximateVisibleCells) ??
    finiteNumber(legacyWbc.approximateVisibleCells) ??
    finiteNumber(fieldAdequacy.visibleLeukocytes);

  return {
    contractVersion: LOCAL_MORPHOLOGY_EVIDENCE_VERSION,
    capturedBeforeGovernors: true,
    analysisSource,
    evidenceAvailable,
    provenance: {
      source: "vision_model_direct_observation",
      interpretationSeparated: true,
      representativitySeparated: true,
    },
    field: {
      description: fieldDescription,
      observableCellularity: firstText(
        explicitField.observableCellularity,
        seeing.cellularity,
      ),
      distribution: firstText(explicitField.distribution),
      background: firstText(explicitField.background),
      technicalQuality: firstText(
        explicitField.technicalQuality,
        legacy.technicalQuality,
        raw.imageQuality?.description,
        raw.imageQuality?.summary,
      ),
      artifacts: [
        ...asArray(explicitField.artifacts),
        ...asArray(explicit.artifacts),
        ...asArray(legacy.artifacts),
      ],
      technicalLimitations: [
        ...asArray(explicitField.technicalLimitations),
        ...asArray(explicit.technicalLimitations),
      ],
    },
    erythrocytes: {
      evaluable: explicitRbc.evaluable ?? Boolean(erythrocyteDescription),
      description: erythrocyteDescription,
      observations: [
        ...asArray(explicitRbc.observations),
        ...asArray(legacyRbc.observations),
      ],
      size: firstText(explicitRbc.size, legacyRbc.size),
      shape: firstText(explicitRbc.shape, legacyRbc.shape),
      chromia: firstText(explicitRbc.chromia, legacyRbc.chromia),
      distribution: firstText(explicitRbc.distribution, legacyRbc.distribution),
      anisocytosis: firstText(
        explicitRbc.anisocytosis,
        legacyRbc.anisocytosis,
      ),
      poikilocytosis: firstText(
        explicitRbc.poikilocytosis,
        legacyRbc.poikilocytosis,
      ),
      specificForms: [
        ...asArray(explicitRbc.specificForms),
        ...asArray(legacyRbc.specificForms),
      ],
      inclusions: [
        ...asArray(explicitRbc.inclusions),
        ...asArray(legacyRbc.inclusions),
      ],
      artifactConsiderations: firstText(
        explicitRbc.artifactConsiderations,
        legacyRbc.artifactConsiderations,
      ),
      positiveFindings: asArray(explicitRbc.positiveFindings),
      uncertainties: asArray(explicitRbc.uncertainties),
    },
    leukocytes: {
      evaluable: explicitWbc.evaluable ?? Boolean(leukocyteDescription),
      observedCellCount,
      description: leukocyteDescription,
      observations: [
        ...asArray(explicitWbc.observations),
        ...asArray(legacyWbc.observations),
      ],
      heterogeneity: firstText(
        explicitWbc.heterogeneity,
        legacyWbc.heterogeneity,
      ),
      nuclearMorphology: firstText(
        explicitWbc.nuclearMorphology,
        legacyWbc.nuclearMorphology,
      ),
      chromatin: firstText(explicitWbc.chromatin, legacyWbc.chromatin),
      nucleoli: firstText(explicitWbc.nucleoli, legacyWbc.nucleoli),
      ncRatio: firstText(explicitWbc.ncRatio, explicitWbc.ncRatioFeatures),
      cytoplasm: firstText(explicitWbc.cytoplasm, legacyWbc.cytoplasm),
      granulation: firstText(explicitWbc.granulation, legacyWbc.granulation),
      inclusions: [
        ...asArray(explicitWbc.inclusions),
        ...asArray(legacyWbc.inclusions),
      ],
      maturation: firstText(explicitWbc.maturation, legacyWbc.maturation),
      atypia: firstText(explicitWbc.atypia, legacyWbc.atypia),
      blastLikeFeatures: firstText(
        explicitWbc.blastLikeFeatures,
        legacyWbc.blastLikeFeatures,
      ),
      positiveFindings: asArray(explicitWbc.positiveFindings),
      uncertainties: asArray(explicitWbc.uncertainties),
    },
    platelets: {
      evaluable: explicitPlt.evaluable ?? Boolean(plateletDescription),
      description: plateletDescription,
      observations: [
        ...asArray(explicitPlt.observations),
        ...asArray(legacyPlt.observations),
      ],
      distribution: firstText(
        explicitPlt.distribution,
        legacyPlt.distribution,
      ),
      size: firstText(explicitPlt.size, legacyPlt.size),
      aggregates: firstText(explicitPlt.aggregates, legacyPlt.aggregates),
      morphology: firstText(explicitPlt.morphology, legacyPlt.morphology),
      positiveFindings: asArray(explicitPlt.positiveFindings),
      uncertainties: asArray(explicitPlt.uncertainties),
    },
    criticalMorphology: normalizeCriticalMorphology(
      asObject(explicit.criticalMorphology),
      raw,
    ),
    positiveEvidence: [...new Set(positiveEvidence)],
    uncertainties: [...new Set(uncertainties)],
    academicReasoning: {
      whatISee: asArray(explicitAcademic.whatISee).length
        ? asArray(explicitAcademic.whatISee)
        : [
            fieldDescription,
            erythrocyteDescription,
            leukocyteDescription,
            plateletDescription,
          ].filter(Boolean),
      whatItResembles: asArray(explicitAcademic.whatItResembles).length
        ? asArray(explicitAcademic.whatItResembles)
        : asArray(legacyAcademic.differentialConsiderations),
      evidenceFor: asArray(explicitAcademic.evidenceFor),
      evidenceAgainst: asArray(explicitAcademic.evidenceAgainst),
      differentialMorphology: asArray(
        explicitAcademic.differentialMorphology,
      ).length
        ? asArray(explicitAcademic.differentialMorphology)
        : asArray(legacyAcademic.differentialConsiderations),
      cannotConfirm: asArray(explicitAcademic.cannotConfirm).length
        ? asArray(explicitAcademic.cannotConfirm)
        : [
            asText(hematologicReasoning.whatICannotConfirm),
            ...asArray(legacyAcademic.confirmationNeeds),
          ].filter(Boolean),
      teachingPoints: asArray(explicitAcademic.teachingPoints).length
        ? asArray(explicitAcademic.teachingPoints)
        : asArray(legacyAcademic.teachingPoints),
    },
    engineEvidence: {
      erythrocyte: null,
      leukocyte: null,
      platelet: null,
    },
  };
}

export function enrichLocalMorphologyEvidenceWithEngines(
  evidence = {},
  {
    erythrocyteAnalysis = {},
    leukocyteAnalysis = {},
    plateletAnalysis = {},
  } = {},
) {
  const base = asObject(evidence);

  return {
    ...base,
    engineEvidence: {
      erythrocyte: {
        findings: asArray(erythrocyteAnalysis.erythrocyteFindings),
        reasoning: asArray(erythrocyteAnalysis.erythrocyteReasoning),
        summary: asText(erythrocyteAnalysis.erythrocyteSummary),
        dominantMorphology: erythrocyteAnalysis.dominantMorphology ?? null,
        morphologicRisk: erythrocyteAnalysis.morphologicRisk ?? null,
      },
      leukocyte: {
        findings: asArray(leukocyteAnalysis.leukocyteFindings),
        reasoning: asArray(leukocyteAnalysis.leukocyteReasoning),
        summary: asText(leukocyteAnalysis.leukocyteSummary),
        primaryPattern: leukocyteAnalysis.primaryPattern ?? null,
        secondaryPattern: leukocyteAnalysis.secondaryPattern ?? null,
        blastRisk: leukocyteAnalysis.blastRisk ?? null,
      },
      platelet: {
        findings: asArray(plateletAnalysis.plateletFindings),
        reasoning: asArray(plateletAnalysis.plateletReasoning),
        summary: asText(plateletAnalysis.plateletSummary),
        dominantPattern: plateletAnalysis.dominantPlateletPattern ?? null,
        emergencyLevel: plateletAnalysis.emergencyLevel ?? null,
      },
    },
  };
}

export function attachLocalMorphologyEvidence(result = {}, evidence = {}) {
  if (!result || typeof result !== "object") return result;

  return {
    ...result,
    localMorphologyEvidence: evidence,
  };
}

export function localMorphologyEvidenceContractStatus(evidence = {}) {
  const value = asObject(evidence);
  const problems = [];

  if (value.contractVersion !== LOCAL_MORPHOLOGY_EVIDENCE_VERSION) {
    problems.push("invalid_contract_version");
  }

  if (value.evidenceAvailable === true) {
    const hasSeriesObservation = Boolean(
      asText(value.erythrocytes?.description) ||
        asText(value.leukocytes?.description) ||
        asText(value.platelets?.description),
    );

    if (!hasSeriesObservation) {
      problems.push("evidence_available_without_series_observation");
    }
  }

  if (
    genericLimitationOnly(value.erythrocytes?.description) ||
    genericLimitationOnly(value.leukocytes?.description) ||
    genericLimitationOnly(value.platelets?.description)
  ) {
    problems.push("adequacy_narrative_used_as_morphology");
  }

  return {
    valid: problems.length === 0,
    problems,
  };
}
