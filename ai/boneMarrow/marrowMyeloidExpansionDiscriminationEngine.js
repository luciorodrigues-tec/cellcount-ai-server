// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.38 — MARROW MYELOID EXPANSION & PATHOLOGIC
// MATURATION-CONTINUUM DISCRIMINATION
// ============================================================================
//
// Clinical/safety invariants:
//  1. A maturation continuum is not automatically physiologic.
//  2. A pathologic myeloid expansion may retain broad granulocytic maturation.
//  3. The engine describes a MORPHOLOGIC PATTERN only; it never diagnoses CML,
//     MPN, leukemia, BCR::ABL1 positivity, or lineage-defining disease.
//  4. A truly distinct/coherent/repeated blastoid subpopulation retains priority.
//  5. Physiologic marrow remains physiologic when disproportionate myeloid
//     expansion is not supported.
// ============================================================================

export const MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION = "BE-FIX-005.38";
export const MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION = "BE-FIX-005.38";
export const MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION = "BE-FIX-005.41";
export const MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION = "BE-FIX-005.41";

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function txt(v) {
  return typeof v === "string" ? v.trim() : "";
}
function norm(v) {
  return txt(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function finite(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function countTrue(values = []) {
  return values.filter((v) => v === true).length;
}
function structuredBoolean(value, narrativeFallback = false) {
  return typeof value === "boolean" ? value : narrativeFallback;
}
function marrowScope(result = {}) {
  const raw = obj(result.rawResponse);
  const t = txt(
    result.specimenType ||
    obj(result.specimenAssessment).specimenType ||
    obj(raw.specimenAssessment).specimenType ||
    result.visualMorphologyEvidenceAcquisition?.specimenScope
  ).toUpperCase();

  return (
    t.includes("BONE_MARROW") ||
    t.includes("MEDULA") ||
    Object.keys(obj(result.marrowAdequacy)).length > 0 ||
    Object.keys(obj(raw.marrowAdequacy)).length > 0
  );
}
function collectMyeloidNarrative(result = {}) {
  const raw = obj(result.rawResponse);
  const my = {
    ...obj(raw.myeloidSeries),
    ...obj(result.myeloidSeries),
  };
  const bl = {
    ...obj(raw.blastAssessment),
    ...obj(result.blastAssessment),
  };
  const ctx = {
    ...obj(obj(raw.blastAssessment).precursorContext),
    ...obj(bl.precursorContext),
  };

  return norm(
    [
      my.maturation,
      my.maturationSpectrum,
      my.morphologicNotes,
      my.summary,
      my.findings,
      my.distribution,
      my.predominance,
      my.expansion,
      ctx.summary,
      ctx.interpretation,
      bl.summary,
      bl.morphologicInterpretation,
      obj(result.whatAISees).globalField,
      obj(result.whatAISees).dominantFinding,
      obj(raw.whatAISees).globalField,
      obj(raw.whatAISees).dominantFinding,
    ]
      .flat(Infinity)
      .filter(Boolean)
      .join(" "),
  );
}

function structuredExpansionContext(result = {}) {
  const raw = obj(result.rawResponse);
  const my = {
    ...obj(raw.myeloidSeries),
    ...obj(result.myeloidSeries),
  };
  return {
    ...obj(obj(raw.myeloidSeries).expansionContext),
    ...obj(my.expansionContext),
  };
}

function blastArchitecture(result = {}) {
  const raw = obj(result.rawResponse);
  const a = {
    ...obj(raw.blastAssessment),
    ...obj(result.blastAssessment),
  };
  const s = {
    ...obj(obj(raw.blastAssessment).morphologySupport),
    ...obj(a.morphologySupport),
  };
  const c = {
    ...obj(obj(raw.blastAssessment).immatureCellCytology),
    ...obj(a.immatureCellCytology),
  };
  const sub = {
    ...obj(obj(raw.blastAssessment).blastoidSubpopulationContext),
    ...obj(a.blastoidSubpopulationContext),
  };

  const distinct =
    sub.distinctFromMaturationContinuum === true ||
    c.distinctFromMaturationContinuum === true;
  const coherent =
    sub.morphologicallyCoherent === true ||
    sub.coherentBlastoidSubsetObserved === true ||
    c.morphologicallyCoherent === true;
  const repeated =
    sub.repeatedSubsetAcrossField === true ||
    sub.repeatedCellsWithSimilarFeatures === true ||
    c.repeatedSubsetAcrossField === true ||
    s.repeatedAcrossField === true;
  const monomorphic = s.monomorphism === true;
  const evidenceState = txt(a.evidenceState).toUpperCase();
  const observed =
    a.observed === true ||
    evidenceState === "OBSERVED_POPULATION";

  const architectureScore = countTrue([
    distinct,
    coherent,
    repeated,
    monomorphic,
  ]);

  const structuredPathologicSubset =
    observed ||
    (distinct && coherent && repeated && architectureScore >= 3);

  return {
    evidenceState,
    distinct,
    coherent,
    repeated,
    monomorphic,
    architectureScore,
    structuredPathologicSubset,
  };
}

export function evaluateMarrowMyeloidExpansion(result = {}) {
  const raw = obj(result.rawResponse);
  const a = {
    ...obj(raw.blastAssessment),
    ...obj(result.blastAssessment),
  };
  const ctx = {
    ...obj(obj(raw.blastAssessment).precursorContext),
    ...obj(a.precursorContext),
  };
  const exp = structuredExpansionContext(result);
  const narrative = collectMyeloidNarrative(result);
  const blast = blastArchitecture(result);
  const my = {
    ...obj(raw.myeloidSeries),
    ...obj(result.myeloidSeries),
  };

  // BE-FIX-005.41 — project structured myeloid maturation evidence into the
  // 005.38 maturation axis. Production VME may acquire maturation=present,
  // broad spectrum and mature neutrophilic forms while precursorContext does
  // not explicitly mark a maturation continuum. That omission must not erase
  // directly acquired maturation evidence.
  const structuredMaturationPresent =
    my.maturation === true ||
    ["present", "preserved", "progressive", "orderly", "maturing"].includes(norm(my.maturation)) ||
    exp.broadMaturationSpectrum === true ||
    exp.matureNeutrophilicFormsPresent === true ||
    exp.leftShiftedMaturationSpectrum === true ||
    /maturation present|maturacao presente|maturacao granulocit|granulocytic maturation|segmented|band forms|formas maduras|formas em maturacao/.test(narrative);

  const immatureCount = finite(
    a.approximateImmatureCellCount ??
    a.approximateImmatureCellCountInProvidedFields
  );
  const burden = norm(a.immatureCellBurden);
  const populationPattern = norm(a.populationPattern);

  const maturationContinuum =
    ctx.maturationContinuum === true ||
    ctx.orderlyGranulocyticMaturation === true ||
    structuredMaturationPresent ||
    /continuum maturativo|maturacao progressiva|maturacao ordenada|espectro maturativo|varios estagios|diferentes estagios/.test(narrative);

  const matureFormsPresent =
    ctx.matureFormsPresent === true ||
    structuredBoolean(
      exp.matureNeutrophilicFormsPresent,
      /formas maduras|segmentad|bastonet|metamieloc|mieloc|neutrofil/.test(narrative),
    );

  const broadMaturationSpectrum =
    structuredBoolean(
      exp.broadMaturationSpectrum,
      /amplo espectro maturativo|espectro granulocitico|diferentes estagios|varios estagios|precursores.*formas maduras|formas precursoras.*maduras/.test(narrative),
    );

  const relativeMyeloidPredominance =
    structuredBoolean(
      exp.relativeMyeloidPredominance,
      /predominio mieloide|predominio granulocit|predominio da serie granulocit|serie mieloide predominante|granulopoese predominante/.test(narrative),
    );

  const disproportionateMyeloidRepresentation =
    structuredBoolean(
      exp.disproportionateMyeloidRepresentation,
      /expansao mieloide|expansao granulocit|hiperplasia mieloide|hiperplasia granulocit|representacao mieloide desproporcional|granulopoese aumentada/.test(narrative),
    );

  const numerousGranulocyticPrecursors =
    structuredBoolean(
      exp.numerousGranulocyticPrecursors,
      burden === "numerous" ||
        burden === "dominant" ||
        (immatureCount !== null && immatureCount >= 12) ||
        /numerosos precursores|muitos precursores|abundantes precursores|grande numero de precursores/.test(narrative),
    );

  const leftShiftedMaturationSpectrum =
    structuredBoolean(
      exp.leftShiftedMaturationSpectrum,
      /desvio a esquerda|espectro maturativo deslocado|aumento de formas imaturas|formas intermediarias aumentadas/.test(narrative),
    );

  const erythroidRelativeReduction =
    structuredBoolean(
      exp.erythroidRelativeReduction,
      /serie eritroide relativamente reduzida|eritropoese relativamente reduzida|reducao relativa eritroide/.test(narrative),
    );

  const basophilEosinophilEnrichment =
    structuredBoolean(
      exp.basophilEosinophilEnrichment,
      /basofilia aumentada|basofilos aumentados|eosinofilos aumentados|eosinofilia associada/.test(narrative),
    );

  const denseMyeloidField =
    structuredBoolean(
      exp.denseMyeloidField,
      /campo densamente celular|alta densidade de celulas mieloides|campo muito celular|numerosos elementos mieloides/.test(narrative),
    );

  const expansionSignals = {
    relativeMyeloidPredominance,
    disproportionateMyeloidRepresentation,
    numerousGranulocyticPrecursors,
    broadMaturationSpectrum,
    matureFormsPresent,
    leftShiftedMaturationSpectrum,
    erythroidRelativeReduction,
    basophilEosinophilEnrichment,
    denseMyeloidField,
  };

  const expansionScore = countTrue(Object.values(expansionSignals));

  // Avoid calling normal pediatric or regenerative marrow "pathologic
  // expansion" simply because it is immature. Require a disproportional/
  // predominant myeloid signal AND an expanded population burden/spectrum.
  const disproportionateAxis =
    relativeMyeloidPredominance ||
    disproportionateMyeloidRepresentation ||
    erythroidRelativeReduction;

  const expansionBurdenAxis =
    numerousGranulocyticPrecursors ||
    denseMyeloidField ||
    (immatureCount !== null && immatureCount >= 12);

  const maturationAxis =
    maturationContinuum &&
    broadMaturationSpectrum &&
    matureFormsPresent;

  const pathologicMyeloidExpansionSupported =
    marrowScope(result) &&
    !blast.structuredPathologicSubset &&
    maturationAxis &&
    disproportionateAxis &&
    expansionBurdenAxis &&
    expansionScore >= 4;

  const physiologicContinuumEligible =
    marrowScope(result) &&
    maturationContinuum &&
    !blast.structuredPathologicSubset &&
    !pathologicMyeloidExpansionSupported;

  return {
    version: MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,
    marrow: marrowScope(result),
    immatureCount,
    immatureCellBurden: burden || null,
    populationPattern: populationPattern || null,
    maturationContinuum,
    structuredMaturationPresent,
    maturationEvidenceProjectionVersion:
      MARROW_MYELOID_MATURATION_EVIDENCE_PROJECTION_VERSION,
    expansionClassificationRecoveryVersion:
      MARROW_EXPANSION_CLASSIFICATION_RECOVERY_VERSION,
    matureFormsPresent,
    broadMaturationSpectrum,
    expansionSignals,
    expansionScore,
    disproportionateAxis,
    expansionBurdenAxis,
    maturationAxis,
    blastArchitecture: blast,
    structuredPathologicSubset: blast.structuredPathologicSubset,
    pathologicMyeloidExpansionSupported,
    physiologicContinuumEligible,
    classification: blast.structuredPathologicSubset
      ? "PATHOLOGIC_BLASTOID_SUBPOPULATION_SUPPORTED"
      : pathologicMyeloidExpansionSupported
        ? "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION"
        : physiologicContinuumEligible
          ? "PHYSIOLOGIC_MATURATION_CONTINUUM_ELIGIBLE"
          : "INDETERMINATE_MYELOID_MATURATION_PATTERN",
  };
}

export function applyMarrowMyeloidExpansionDiscrimination(result = {}) {
  if (!result || typeof result !== "object") return result;

  const e = evaluateMarrowMyeloidExpansion(result);
  if (!e.marrow) return result;

  result.marrowMyeloidExpansionDiscrimination = e;

  if (!e.pathologicMyeloidExpansionSupported) {
    return result;
  }

  result.marrowPathologicMaturationContinuumLock = {
    version: MARROW_PATHOLOGIC_MATURATION_CONTINUUM_VERSION,
    active: true,
    classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
    blastoidPopulationSupported: false,
    physiologicAutoClassificationBlocked: true,
    reason:
      "Disproportionate myeloid/granulocytic expansion with broad maturation spectrum and mature forms, without a distinct/coherent/repeated blastoid subpopulation.",
    diagnosticClaimsForbidden: [
      "CML",
      "LMC",
      "MPN",
      "BCR::ABL1",
      "leukemia diagnosis",
    ],
  };

  // If a 005.37 physiologic lock was already created by a previous pass, the
  // pathologic-expansion state is the more specific maturation-continuum class.
  if (obj(result.marrowPhysiologicMaturationContinuumLock).active === true) {
    result.marrowPhysiologicMaturationContinuumLock = {
      ...obj(result.marrowPhysiologicMaturationContinuumLock),
      active: false,
      supersededBy: MARROW_MYELOID_EXPANSION_DISCRIMINATION_VERSION,
    };
  }

  result.findings = {
    ...obj(result.findings),
    blastSuspicion: false,
    monomorphicPopulation: false,
    // Avoid legacy "immatureCells=true => blast" coupling. The expanded
    // precursor burden is represented in the dedicated marrow pattern.
    immatureCells: false,
    myeloidExpansionPattern: true,
  };

  result.normalityBlocked = true;
  result.requiresHumanReview = true;
  result.finalClassification =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  result.morphologicRiskClass =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  result.riskLevel =
    "Expansão mieloide/granulocítica relevante com maturação preservada";

  const mainFinding =
    "Expansão relativa da série mieloide/granulocítica com amplo espectro maturativo e coexistência de formas precursoras e maduras, sem subpopulação blastoide distinta, coerente e repetida sustentada neste campo.";

  result.mainFinding = mainFinding;
  result.primaryFinding = mainFinding;
  result.finalConclusion = mainFinding;

  result.morphologyAnalysis = {
    ...obj(result.morphologyAnalysis),
    overview:
      "Campo medular com representação mieloide/granulocítica aumentada e diversidade de estágios maturativos.",
    leukocyteReview:
      "A arquitetura é de expansão mieloide com maturação, e não de população blastoide monomórfica. A imagem isolada não permite definir etiologia ou entidade hematológica.",
    summary: mainFinding,
  };

  result.patternRecognition = {
    ...obj(result.patternRecognition),
    overallPattern:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  };

  result.overallAssessment = {
    ...obj(result.overallAssessment),
    requiresHumanReview: true,
    riskCategory:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    mainImpression: mainFinding,
  };

  result.structuredReport = {
    ...obj(result.structuredReport),
    conclusion: mainFinding,
    hematologicMeaning:
      "Padrão morfológico de expansão mieloide com maturação preservada. Pode ocorrer em contextos reacionais ou proliferativos e não permite diagnóstico etiológico por fotografia isolada.",
    recommendation:
      "Correlacionar com hemograma completo, diferencial leucocitário, revisão do mielograma e investigação hematológica/molecular quando clinicamente indicada.",
  };

  result.clinicalMeaning =
    "O padrão sugere aumento relativo da representação mieloide/granulocítica mantendo espectro de maturação. Este achado não equivale a população blástica e não estabelece diagnóstico de doença mieloproliferativa. Requer correlação com hemograma, contagem diferencial, contexto clínico e exames complementares apropriados.";

  return result;
}

export default applyMarrowMyeloidExpansionDiscrimination;
