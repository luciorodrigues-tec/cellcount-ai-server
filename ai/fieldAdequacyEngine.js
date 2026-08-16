// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.2 — FIELD ADEQUACY ENGINE FA-4.0
// Field Adequacy Decoupling
//
// Scientific invariant:
//   LIMITED_FIELD != NO_MORPHOLOGY
//
// Field representativity constrains population-level inference and global
// exclusions. It does not erase direct local morphology evidence (LME-1.0).
// ============================================================================

export const FIELD_ADEQUACY_CONTRACT_VERSION = "FA-4.0";
export const BLAST_ASSESSABILITY_GATE_VERSION = "BE-FIX-005.16";
export const POSITIVE_BLAST_OVERRIDE_VERSION = "BE-FIX-005.29";

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesAny(text = "", terms = []) {
  const normalized = normalizeText(text);
  return terms.some((term) => normalized.includes(normalizeText(term)));
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function hasStructuredPositiveMarrowBlastEvidence(analysis = {}) {
  const rawBlast = asObject(analysis?.rawResponse?.blastAssessment);
  const directBlast = asObject(analysis?.blastAssessment);
  const lmeBlast = asObject(analysis?.localMorphologyEvidence?.marrow?.blastPopulationEvidence);
  const projected = asObject(analysis?.marrowBlastPopulationEvidence);
  const recoveredLock = asObject(analysis?.marrowPositiveBlastEvidenceLock);
  const recovered = asObject(analysis?.marrowRecoveredCytologyProjection);
  const states = [
    rawBlast.evidenceState,
    directBlast.evidenceState,
    lmeBlast.evidenceState,
    projected.evidenceState,
  ].map((value) => String(value || "").trim().toUpperCase());

  return (
    states.some((state) => [
      "OBSERVED_POPULATION",
      "SUSPICIOUS_POPULATION",
      "FOCAL_SUSPICION",
    ].includes(state)) ||
    lmeBlast.positive === true ||
    projected.observedPopulation === true ||
    projected.suspiciousPopulation === true ||
    projected.focalSuspicion === true ||
    recoveredLock.active === true ||
    recovered.structuredPositive === true
  );
}

function hasLocalMorphologyEvidence(analysis = {}) {
  const lme = asObject(analysis?.localMorphologyEvidence);

  if (lme.contractVersion === "LME-1.0") return true;
  if (lme.evidenceAvailable === true) return true;

  return Object.keys(lme).length > 0;
}

function meaningfulMorphologyText(value) {
  const text = normalizeText(value);
  if (!text) return false;

  return ![
    "nao avaliavel",
    "não avaliável",
    "not assessable",
    "indeterminado",
    "indeterminada",
    "nao determinado",
    "não determinado",
    "insuficiente",
    "nao visivel",
    "não visível",
  ].some((term) => text.includes(normalizeText(term)));
}

function evaluateBlastAssessability(analysis = {}, visibleLeukocytes = 0) {
  const positiveMarrowBlastEvidence =
    hasStructuredPositiveMarrowBlastEvidence(analysis);
  const explicitField = asObject(analysis?.fieldAdequacy);
  const rawField = asObject(analysis?.rawResponse?.fieldAdequacy);
  const lmeWbc = asObject(analysis?.localMorphologyEvidence?.leukocytes);
  const rawLmeWbc = asObject(
    analysis?.rawResponse?.localMorphologyEvidence?.leukocytes,
  );

  const explicitAdequacy =
    typeof explicitField.adequateForBlastScreening === "boolean"
      ? explicitField.adequateForBlastScreening
      : (
          typeof rawField.adequateForBlastScreening === "boolean"
            ? rawField.adequateForBlastScreening
            : null
        );

  const wbc = Object.keys(lmeWbc).length ? lmeWbc : rawLmeWbc;

  const detailSignals = {
    chromatin: meaningfulMorphologyText(wbc.chromatin),
    nucleoli: meaningfulMorphologyText(wbc.nucleoli),
    ncRatio: meaningfulMorphologyText(wbc.ncRatio ?? wbc.ncRatioFeatures),
    blastLikeFeatures: meaningfulMorphologyText(wbc.blastLikeFeatures),
    nuclearMorphology: meaningfulMorphologyText(wbc.nuclearMorphology),
  };

  const detailedNuclearFeatureCount = Object.values(detailSignals)
    .filter(Boolean).length;

  const technicalText = normalizeText([
    explicitField.limitationReason,
    rawField.limitationReason,
    analysis?.localMorphologyEvidence?.field?.technicalQuality,
    ...(Array.isArray(
      analysis?.localMorphologyEvidence?.field?.technicalLimitations
    )
      ? analysis.localMorphologyEvidence.field.technicalLimitations
      : []),
  ].filter(Boolean).join(" | "));

  const nuclearDetailLimited = includesAny(technicalText, [
    "detalhes nucleares finos nao sao avaliaveis",
    "detalhe nuclear insuficiente",
    "resolucao insuficiente para detalhes nucleares",
    "cromatina nao avaliavel",
    "nucleolos nao avaliaveis",
    "relacao n:c nao avaliavel",
    "foco insuficiente",
    "desfocad",
  ]);

  let adequateForBlastScreening = false;
  let state = "NOT_ASSESSABLE";
  let reason =
    "A exclusão morfológica de blastos requer detalhe nuclear/citoplasmático avaliável; a simples presença de leucócitos não é suficiente.";

  if (explicitAdequacy === false) {
    adequateForBlastScreening = false;
    state = "NOT_ASSESSABLE";
    reason =
      "O modelo visual marcou explicitamente o campo como inadequado para triagem/exclusão morfológica de blastos.";
  } else if (
    explicitAdequacy === true &&
    !nuclearDetailLimited
  ) {
    adequateForBlastScreening = true;
    state = "EVALUABLE";
    reason =
      "O campo foi explicitamente marcado como avaliável para triagem de blastos e não há limitação nuclear conflitante.";
  } else if (
    visibleLeukocytes >= 1 &&
    detailedNuclearFeatureCount >= 2 &&
    !nuclearDetailLimited
  ) {
    adequateForBlastScreening = true;
    state = "EVALUABLE";
    reason =
      "Há leucócito(s) visível(is) com pelo menos dois descritores nucleares/citoplasmáticos diretamente avaliáveis.";
  }

  return {
    version: BLAST_ASSESSABILITY_GATE_VERSION,
    state,
    adequateForBlastScreening,
    explicitAdequacy,
    visibleLeukocytes,
    detailedNuclearFeatureCount,
    detailSignals,
    nuclearDetailLimited,
    // BE-FIX-005.29 — this gate governs NEGATIVE exclusion only.
    // Positive structured marrow blast evidence remains valid even when the
    // field is not adequate to exclude blast morphology globally.
    negativeBlastConclusionAllowed: adequateForBlastScreening,
    assessabilityScope: "NEGATIVE_EXCLUSION_ONLY",
    positiveEvidencePresent: positiveMarrowBlastEvidence,
    positiveEvidencePreserved: positiveMarrowBlastEvidence,
    negativeOnlyGateVersion: "BE-FIX-005.29",
    reason,
  };
}

function buildAdequacyContract({
  visibleLeukocytes,
  singleCellConcern,
  parasiteSignal,
  unusualStructureSignal,
  localMorphologyEvidenceAvailable,
  blastAssessability,
}) {
  const adequateForPopulationAssessment = visibleLeukocytes >= 8;
  const limitedField = !adequateForPopulationAssessment;

  return {
    contractVersion: FIELD_ADEQUACY_CONTRACT_VERSION,

    visibleLeukocytes,
    singleCellConcern,
    parasiteSignal,
    unusualStructureSignal,

    adequateForLeukocyteAnalysis:
      visibleLeukocytes >= 3 || singleCellConcern,

    adequateForBlastScreening:
      blastAssessability?.adequateForBlastScreening === true,

    positiveBlastEvidenceOverride: {
      version: POSITIVE_BLAST_OVERRIDE_VERSION,
      active: blastAssessability?.positiveEvidencePresent === true,
      assessabilityScope: "NEGATIVE_EXCLUSION_ONLY",
      principle: "POSITIVE_MARROW_BLAST_EVIDENCE_IS_VALID_EVEN_WHEN_NEGATIVE_SCREENING_IS_NOT_ASSESSABLE",
    },

    blastAssessability:
      blastAssessability || {
        version: BLAST_ASSESSABILITY_GATE_VERSION,
        state: "NOT_ASSESSABLE",
        adequateForBlastScreening: false,
        negativeBlastConclusionAllowed: false,
      },

    adequateForPopulationAssessment,
    limitedField,

    // BE-FIX-005.2 / FA-4.0 decoupling contract.
    populationInferenceAllowed: adequateForPopulationAssessment,

    // Morphology directly visible in the submitted field may still be described
    // even when that field is not representative of the whole slide.
    morphologyDescriptionAllowed: true,

    // This flag is an invariant declaration for downstream governors:
    // field adequacy must not delete or replace canonical LME-1.0 evidence.
    localMorphologyEvidencePreserved: true,

    // Global "absent / normal / excluded on the slide" conclusions require
    // representative sampling. Limited-field negatives are field-scoped only.
    globalNegativeExclusionAllowed: adequateForPopulationAssessment,

    localMorphologyEvidenceAvailable,

    limitationReason:
      adequateForPopulationAssessment
        ? ""
        : "Campo com baixa representatividade celular; limita inferências populacionais e exclusões globais, sem invalidar a morfologia diretamente observada.",
  };
}

export function evaluateFieldAdequacy(analysis = {}) {
  const raw = normalizeText(JSON.stringify(analysis || ""));

  const leukocyteTerms = [
    "leucocito",
    "leucócito",
    "neutrofilo",
    "neutrófilo",
    "segmentado",
    "linfocito",
    "linfócito",
    "monocito",
    "monócito",
    "eosinofilo",
    "eosinófilo",
    "basofilo",
    "basófilo",
  ];

  // Prefer an explicit visual count supplied by the morphology model.
  // The previous implementation capped lexical evidence below the population
  // threshold, making adequacy mathematically unreachable in some responses.
  const explicitVisibleLeukocytes = Number(
    analysis?.fieldAdequacy?.visibleLeukocytes ??
      analysis?.visualExtraction?.visibleLeukocytes ??
      analysis?.rawResponse?.fieldAdequacy?.visibleLeukocytes ??
      NaN,
  );

  let lexicalLeukocyteSignals = 0;
  for (const term of leukocyteTerms) {
    if (raw.includes(normalizeText(term))) lexicalLeukocyteSignals++;
  }

  const visibleLeukocytes =
    Number.isFinite(explicitVisibleLeukocytes) &&
    explicitVisibleLeukocytes >= 0
      ? Math.round(explicitVisibleLeukocytes)
      : lexicalLeukocyteSignals;

  const unusualStructureSignal = includesAny(raw, [
    "estrutura incomum",
    "estrutura extracelular",
    "estrutura alongada",
    "estrutura curvilinea",
    "estrutura curvilínea",
    "estrutura filamentosa",
    "estrutura serpiginosa",
    "estrutura flagelada",
    "forma extracelular",
    "forma alongada",
    "forma flagelada",
    "organismo extracelular",
    "filamento extracelular",
    "elemento extracelular",
  ]);

  const parasiteSignal =
    includesAny(raw, [
      "parasita",
      "hemoparasita",
      "protozoario",
      "protozoário",
      "plasmodium",
      "babesia",
      "trypanosoma",
      "tripanossoma",
      "tripomastigota",
      "microfilaria",
      "microfilária",
      "filaria",
      "filária",
      "flagelo",
      "flagelado",
      "membrana ondulante",
      "cinetoplasto",
      "intraeritrocitario",
      "intraeritrocitário",
    ]) || unusualStructureSignal;

  const singleCellConcern =
    includesAny(raw, [
      "celula mononuclear grande",
      "célula mononuclear grande",
      "linfocito reativo",
      "linfócito reativo",
      "linfocito atipico",
      "linfócito atípico",
      "plasmocito",
      "plasmócito",
      "plasmoblasto",
      "blasto",
    ]) || parasiteSignal;

  const blastAssessability =
    evaluateBlastAssessability(analysis, visibleLeukocytes);

  return buildAdequacyContract({
    visibleLeukocytes,
    singleCellConcern,
    parasiteSignal,
    unusualStructureSignal,
    localMorphologyEvidenceAvailable: hasLocalMorphologyEvidence(analysis),
    blastAssessability,
  });
}

export function applyFieldAdequacyRules(analysis = {}) {
  const preservedLocalMorphologyEvidence =
    analysis?.localMorphologyEvidence;

  const fieldAdequacy = evaluateFieldAdequacy(analysis);

  analysis.fieldAdequacy = fieldAdequacy;

  analysis.findings = {
    ...(analysis.findings || {}),
  };

  analysis.morphologyAnalysis = {
    ...(analysis.morphologyAnalysis || {}),
  };

  analysis.whatAISees = {
    ...(analysis.whatAISees || {}),
  };

  analysis.patternRecognition = {
    ...(analysis.patternRecognition || {}),
  };

  analysis.overallAssessment = {
    ...(analysis.overallAssessment || {}),
  };

  analysis.structuredReport = {
    ...(analysis.structuredReport || {}),
  };

  // Explicitly keep the canonical local evidence reference untouched.
  // Field Adequacy is not authorized to rewrite LME-1.0.
  if (preservedLocalMorphologyEvidence !== undefined) {
    analysis.localMorphologyEvidence = preservedLocalMorphologyEvidence;
  }

  if (
    fieldAdequacy.parasiteSignal ||
    fieldAdequacy.unusualStructureSignal
  ) {
    analysis.normalityBlocked = true;
    analysis.requiresHumanReview = true;

    analysis.findings.parasiteSuspected = true;
    analysis.findings.unusualStructureSuspected = true;

    analysis.riskLevel =
      "Campo com estrutura incomum/hemoparasita suspeito";

    analysis.blockNormalReason = [
      ...new Set([
        ...(Array.isArray(analysis.blockNormalReason)
          ? analysis.blockNormalReason
          : []),
        "Estrutura incomum suspeita para hemoparasita ou artefato",
        "Não afirmar normalidade global diante de estrutura incomum",
      ]),
    ];

    analysis.whatAISees.unusualStructures =
      analysis.whatAISees.unusualStructures ||
      "Estrutura incomum/hemoparasitária suspeita deve ser considerada e validada em múltiplos campos.";

    analysis.patternRecognition.overallPattern =
      analysis.patternRecognition.overallPattern ||
      "Estrutura incomum/hemoparasita suspeito";

    analysis.overallAssessment.requiresHumanReview = true;
    analysis.overallAssessment.riskCategory =
      "CLASS_2_UNUSUAL_HEMOPARASITE_STRUCTURE";

    analysis.structuredReport.recommendation =
      analysis.structuredReport.recommendation ||
      "Confirmar por revisão microscópica profissional, múltiplos campos, gota espessa/esfregaço seriado e métodos complementares conforme protocolo.";
  }

  const atypicalPopulation =
    analysis?.findings?.monomorphicPopulation === true ||
    analysis?.findings?.largeMononuclearCells === true ||
    analysis?.findings?.atypicalLymphocytes === true ||
    analysis?.findings?.reactiveLymphocytes === true ||
    analysis?.findings?.plasmacytoidCells === true ||
    analysis?.findings?.plasmablasts === true;

  if (!fieldAdequacy.limitedField) {
    // Representative field: population inference and global negative
    // exclusions may proceed according to downstream engines.
    return analysis;
  }

  // ========================================================================
  // BE-FIX-005.2 — LIMITED FIELD DECOUPLING
  // ========================================================================
  // Limited field is a representativity constraint, not a morphology eraser.
  // Preserve every positive/observational finding produced upstream and only
  // block population-wide inference, global negative exclusions and
  // overconfidence.
  // ========================================================================

  analysis.normalityBlocked = true;
  analysis.requiresHumanReview = true;

  // Preserve a more specific pre-existing risk class produced by a positive
  // finding (e.g. unusual structure) instead of blindly downgrading it.
  if (
    !analysis.finalClassification ||
    analysis.finalClassification === "CLASS_0_NORMAL"
  ) {
    analysis.finalClassification = atypicalPopulation
      ? "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL"
      : "CLASS_1_LIMITED_FIELD";
  }

  if (
    !analysis.morphologicRiskClass ||
    analysis.morphologicRiskClass === "CLASS_0_NORMAL"
  ) {
    analysis.morphologicRiskClass = atypicalPopulation
      ? "CLASS_1_LIMITED_FIELD_ATYPICAL_CELL"
      : "CLASS_1_LIMITED_FIELD";
  }

  if (
    !analysis.riskLevel ||
    normalizeText(analysis.riskLevel).includes("normal")
  ) {
    analysis.riskLevel = atypicalPopulation
      ? "Campo limitado contendo população atípica/reacional"
      : "Campo limitado";
  }

  analysis.blockNormalReason = [
    ...new Set([
      ...(Array.isArray(analysis.blockNormalReason)
        ? analysis.blockNormalReason
        : []),
      "Baixa representatividade celular",
      "Campo insuficiente para afirmar normalidade global",
      "Achados observados permanecem válidos para o campo analisado",
      ...(atypicalPopulation
        ? ["Campo limitado contendo população atípica/reacional."]
        : []),
    ]),
  ];

  analysis.findings = {
    ...(analysis.findings || {}),
  };
  // IMPORTANT: do not convert unknown/not-observed into false in a limited field.

  const morphology = {
    ...(analysis.morphologyAnalysis || {}),
  };

  analysis.morphologyAnalysis = {
    ...morphology,

    overview:
      morphology.overview ||
      "Campo microscópico limitado para conclusão global; os achados morfológicos observáveis neste campo são preservados e devem ser interpretados sem generalização para toda a lâmina.",

    erythrocyteReview:
      morphology.erythrocyteReview ||
      "Hemácias visíveis no campo podem ser descritas morfologicamente; a representatividade limitada impede generalização do padrão eritrocitário para toda a lâmina.",

    leukocyteReview:
      morphology.leukocyteReview ||
      "Leucócitos visíveis devem ser descritos morfologicamente no campo analisado; a baixa representatividade impede diferencial populacional confiável e exclusões globais.",

    plateletReview:
      morphology.plateletReview ||
      "Elementos plaquetários visíveis podem ser descritos no campo; a imagem isolada não sustenta avaliação quantitativa global.",

    biologicalInterpretation:
      morphology.biologicalInterpretation ||
      "A baixa representatividade limita inferências populacionais, mas não invalida achados morfológicos positivos observados no campo.",

    summary:
      morphology.summary ||
      "Campo limitado: preservar os achados morfológicos observados, sem afirmar normalidade global ou excluir alterações não representadas na imagem.",

    absentFindings:
      morphology.absentFindings ||
      "Elementos não observados neste campo devem ser reportados como não observados no campo avaliável, sem exclusão global na lâmina.",
  };

  const seen = {
    ...(analysis.whatAISees || {}),
  };

  analysis.whatAISees = {
    ...seen,

    globalField:
      seen.globalField ||
      "Campo microscópico com representatividade limitada para avaliação global.",

    imageLimitations:
      seen.imageLimitations ||
      "Campo único/limitado: achados observáveis são preservados, porém não devem ser generalizados para toda a lâmina.",

    // Scope the negative statement to the evaluated field instead of claiming
    // slide-wide absence.
    negativeFindings:
      seen.negativeFindings ||
      "Elementos não visualizados no campo avaliável não podem ser considerados globalmente ausentes na lâmina.",
  };

  analysis.patternRecognition = {
    ...(analysis.patternRecognition || {}),
    overallPattern:
      analysis.patternRecognition?.overallPattern ||
      "Campo limitado para conclusão populacional; morfologia observada preservada",
  };

  analysis.interpretiveSynthesis =
    analysis.interpretiveSynthesis ||
    "A representatividade limitada reduz a força das conclusões populacionais, sem apagar os achados morfológicos positivos observados no campo.";

  analysis.clinicalMeaning =
    analysis.clinicalMeaning ||
    "Campo limitado. Os achados morfológicos observados devem ser correlacionados com hemograma completo, múltiplos campos e revisão microscópica profissional.";

  analysis.overallAssessment = {
    ...(analysis.overallAssessment || {}),
    requiresHumanReview: true,

    // Keep a more specific positive-risk category if one already exists.
    riskCategory:
      analysis.overallAssessment?.riskCategory &&
      analysis.overallAssessment.riskCategory !== "CLASS_0_NORMAL"
        ? analysis.overallAssessment.riskCategory
        : analysis.morphologicRiskClass,

    mainImpression:
      analysis.overallAssessment?.mainImpression ||
      analysis.morphologyAnalysis.summary,
  };

  analysis.structuredReport = {
    ...(analysis.structuredReport || {}),

    conclusion:
      analysis.structuredReport?.conclusion ||
      analysis.morphologyAnalysis.summary,

    hematologicMeaning:
      analysis.structuredReport?.hematologicMeaning ||
      analysis.clinicalMeaning,

    recommendation:
      analysis.structuredReport?.recommendation ||
      "Correlacionar com hemograma completo, avaliação de múltiplos campos e revisão microscópica profissional.",
  };

  // Reassert canonical evidence identity after all adequacy transformations.
  if (preservedLocalMorphologyEvidence !== undefined) {
    analysis.localMorphologyEvidence = preservedLocalMorphologyEvidence;
  }

  return analysis;
}
