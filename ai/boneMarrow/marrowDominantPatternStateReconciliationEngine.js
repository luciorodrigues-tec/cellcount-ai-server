// ============================================================================
// BE-FIX-005.42 — MARROW DOMINANT PATTERN STATE RECONCILIATION
// Reconciles downstream state after a protected 005.38/005.41 myeloid-expansion
// classification. It never creates blast negativity and never diagnoses CML/MPN.
// ============================================================================

export const MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION = "BE-FIX-005.42";
export const MARROW_PRECURSOR_BLAST_SEMANTIC_SEPARATION_VERSION = "BE-FIX-005.42";
export const MARROW_GLOBAL_PATTERN_RECONCILIATION_VERSION = "BE-FIX-005.42";

function obj(v) { return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

function structuredBlastPopulation(result = {}) {
  const e = obj(result.marrowMyeloidExpansionDiscrimination);
  const b = obj(e.blastArchitecture);
  const p = obj(result.marrowPrecursorDiscrimination);
  const l = obj(result.marrowPositiveBlastEvidenceLock);
  const g = obj(result.marrowBlastPopulationGovernance);
  return e.structuredPathologicSubset === true ||
    b.structuredPathologicSubset === true ||
    p.coherentBlastoidSubpopulation === true ||
    l.positiveEvidencePreserved === true && l.coherentSubset === true ||
    g.observedPopulation === true;
}

function myeloidPrecursorsObserved(result = {}) {
  const my = obj(result.myeloidSeries);
  const ex = obj(my.expansionContext);
  const blast = obj(result.blastAssessment);
  return ex.numerousGranulocyticPrecursors === true ||
    ex.leftShiftedMaturationSpectrum === true ||
    String(my.maturationSpectrum || "").trim().length > 0 ||
    ["few", "multiple", "numerous", "many"].includes(String(blast.immatureCellBurden || "").toLowerCase());
}

export function evaluateMarrowDominantPatternState(result = {}) {
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const lock = obj(result.marrowPathologicMaturationContinuumLock);
  const expansionProtected =
    expansion.pathologicMyeloidExpansionSupported === true ||
    lock.active === true && lock.classification === "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION";
  const blastPopulation = structuredBlastPopulation(result);
  const precursorObserved = myeloidPrecursorsObserved(result);
  return {
    version: MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
    expansionProtected,
    structuredBlastPopulation: blastPopulation,
    reconciliationAllowed: expansionProtected && !blastPopulation,
    myeloidPrecursorsObserved: precursorObserved,
    blastPopulationNotDemonstratedInEvaluableField: expansionProtected && !blastPopulation,
    globalBlastExclusionAllowed: false,
  };
}

export function applyMarrowDominantPatternStateReconciliation(result = {}) {
  if (!result || typeof result !== "object") return result;
  const state = evaluateMarrowDominantPatternState(result);
  result.marrowDominantPatternStateReconciliation = state;
  if (!state.reconciliationAllowed) return result;

  const finding = "Expansão relativa da série mieloide/granulocítica com amplo espectro maturativo e coexistência de formas precursoras e maduras, sem subpopulação blastoide distinta, coerente e repetida sustentada neste campo.";

  // Semantic separation: legacy immatureCells remains blast-oriented for old
  // consumers; precursor immaturity is represented explicitly and independently.
  result.findings = {
    ...obj(result.findings),
    blastSuspicion: false,
    immatureCells: false,
    myeloidPrecursorsObserved: state.myeloidPrecursorsObserved,
    myeloidImmaturityWithinMaturationContinuum: state.myeloidPrecursorsObserved,
    myeloidExpansionPattern: true,
  };

  result.marrowPrecursorBlastSemanticSeparation = {
    version: MARROW_PRECURSOR_BLAST_SEMANTIC_SEPARATION_VERSION,
    myeloidPrecursorsObserved: state.myeloidPrecursorsObserved,
    legacyImmatureCellsMeansBlastOrUnresolvedBlastoidConcern: true,
    structuredBlastPopulationSupported: false,
    globalBlastExclusionAllowed: false,
  };

  // Residual indeterminate states are superseded, not deleted: provenance is
  // retained while the dominant protected pattern becomes the effective state.
  for (const key of ["marrowPrecursorDiscrimination", "marrowMaturationContinuumDiscrimination"]) {
    const prior = obj(result[key]);
    if (Object.keys(prior).length) {
      result[key] = {
        ...prior,
        priorClassification: prior.classification || null,
        classification: "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
        supersededByDominantPatternReconciliation: true,
        dominantPatternReconciliationVersion: MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
      };
    }
  }

  const cyt = obj(result.marrowPositiveCytologyConsistency);
  if (Object.keys(cyt).length) {
    result.marrowPositiveCytologyConsistency = {
      ...cyt,
      priorState: cyt.state || cyt.candidateEvidenceState || null,
      state: "CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION_CONTINUUM",
      unresolvedPositiveCytology: false,
      contextualizedByDominantPattern: true,
      dominantPatternReconciliationVersion: MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
    };
  }

  result.globalPattern = {
    ...obj(result.globalPattern),
    dominantPattern: "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    physiologicAppearance: false,
    normalityBlocked: true,
    marrowDominantPatternReconciled: true,
    marrowGlobalPatternReconciliationVersion: MARROW_GLOBAL_PATTERN_RECONCILIATION_VERSION,
  };

  result.finalClassification = "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  result.morphologicRiskClass = "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  result.normalityBlocked = true;
  result.requiresHumanReview = true;
  result.mainFinding = finding;
  result.primaryFinding = finding;
  result.finalConclusion = finding;

  // Never invent a leukocyte count. A legacy zero in a marrow field with
  // structured cellular evidence is converted to unknown/null, not to a count.
  const field = obj(result.fieldAdequacy);
  const currentVisible = num(result.visibleLeukocytes);
  const fieldVisible = num(field.visibleLeukocytes);
  if (currentVisible === 0 && (fieldVisible === null || fieldVisible === 0) && state.myeloidPrecursorsObserved) {
    result.visibleLeukocytes = null;
    result.visibleLeukocyteCountSemantics = {
      version: MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
      value: null,
      reason: "Not explicitly enumerated; structured marrow cellular evidence is present, so zero must not be interpreted as an observed zero-cell field.",
    };
  }

  const confidence = obj(result.confidenceAnalysis);
  const currentConfidence = num(confidence.globalConfidenceScore);
  result.confidenceAnalysis = {
    ...confidence,
    globalConfidenceScore: currentConfidence === null || currentConfidence <= 0 ? 40 : currentConfidence,
    patternConfidenceScope: "MORPHOLOGIC_PATTERN_ONLY",
    patternConfidenceSummary: "Confiança conservadora no padrão morfológico observado; não representa confiança diagnóstica etiológica nem exclui blastos globalmente.",
    marrowDominantPatternReconciliationVersion: MARROW_DOMINANT_PATTERN_STATE_RECONCILIATION_VERSION,
  };

  return result;
}

export default applyMarrowDominantPatternStateReconciliation;
