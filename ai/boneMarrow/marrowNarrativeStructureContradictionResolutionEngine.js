// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.31 — MARROW NARRATIVE–STRUCTURE CONTRADICTION RESOLUTION
// & PHYSIOLOGIC DOMINANCE RECOVERY
//
// Purpose:
//   Resolve a narrow but clinically important failure mode in which the vision
//   narrative explicitly describes heterogeneous marrow maturation and denies
//   a distinct/monomorphic blastoid subset while structured boolean fields
//   simultaneously claim distinct/coherent/repeated blastoid architecture.
//
// Safety invariants:
//   1. Narrative negation may correct a contradictory SUSPICIOUS population,
//      but never erase an explicitly OBSERVED population with direct support.
//   2. Physiologic maturation language is not sufficient by itself to suppress
//      a true blastoid subset; suppression requires an explicit architecture
//      negation/discordance plus weak independent blast cytology.
//   3. Repeated immature precursors are not equivalent to a repeated blastoid
//      subset. Whole-field precursor repetition may remain true while blastoid
//      subpopulation repetition is corrected to false.
//   4. BE-FIX-005.29 remains authoritative for genuinely supported positive
//      evidence. 005.31 only prevents false positive evidence from entering it.
// ============================================================================

export const MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION = "BE-FIX-005.31";
export const MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION = "BE-FIX-005.31";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function text(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(" ");
  return "";
}

function norm(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(value, patterns = []) {
  const valueNorm = norm(value);
  return patterns.some((pattern) => pattern.test(valueNorm));
}

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function collectNarrative(result = {}) {
  const blast = obj(result.blastAssessment);
  const myeloid = obj(result.myeloidSeries);
  const visual = obj(result.visualExtraction);
  const sees = obj(result.whatAISees);
  const morph = obj(result.morphologyAnalysis);
  const executive = obj(result.executiveSummary);
  const synthesis = obj(result.interpretiveSynthesis);
  const reasoning = obj(result.hematologicReasoning);
  const population = obj(result.populationPatternAnalysis);

  return norm([
    blast.summary,
    myeloid.summary,
    myeloid.maturation,
    visual.summary,
    sees.summary,
    sees.globalField,
    sees.leukocytes,
    sees.dominantFinding,
    sees.freeNarrative,
    morph.summary,
    morph.overview,
    morph.leukocyteReview,
    executive.summary,
    synthesis.summary,
    reasoning.summary,
    population.summary,
  ].filter(Boolean).join(" "));
}

const NEGATION = Object.freeze({
  noDistinctBlastoidSubset: [
    /nao (?:se )?(?:identifica|identificam|observa|observam|reconhece|reconhecem|caracteriza|caracterizam|demonstra|demonstram)[^.]{0,180}(?:subpopulacao|populacao|subconjunto)[^.]{0,80}blastoide/,
    /sem [^.]{0,120}(?:subpopulacao|populacao|subconjunto)[^.]{0,80}blastoide/,
    /(?:subpopulacao|populacao|subconjunto)[^.]{0,80}blastoide[^.]{0,80}(?:nao demonstrad|nao caracterizad|nao identificad)/,
    /nao ha [^.]{0,120}(?:subpopulacao|populacao|subconjunto)[^.]{0,80}blastoide/,
  ],
  noMonomorphicBlastoidPopulation: [
    /nao [^.]{0,120}(?:populacao|subpopulacao|padrao)[^.]{0,100}blastoide[^.]{0,100}monomorf/,
    /nao [^.]{0,120}monomorf[^.]{0,100}blastoide/,
    /sem [^.]{0,120}monomorf[^.]{0,100}blastoide/,
    /padrao nao (?:e )?(?:uniformemente|predominantemente) blastoide/,
  ],
  noSeparationFromContinuum: [
    /nao [^.]{0,160}(?:separad|distint|destacad)[^.]{0,100}(?:continuum|continuidade) maturativ/,
    /sem [^.]{0,140}(?:separacao|distincao)[^.]{0,100}(?:continuum|continuidade) maturativ/,
    /nao [^.]{0,160}(?:inequivocamente )?separad[^.]{0,100}(?:continuum|continuidade) maturativ/,
  ],
});

const PHYSIOLOGIC = Object.freeze({
  continuum: [
    /continu(?:um|idade) maturativ/,
    /diferentes estagios maturativ/,
    /formas? (?:granulociticas? )?(?:maduras?|intermediarias?) (?:e|com) (?:precursores?|formas? imaturas?)/,
    /precursores? e formas? maduras? coexist/,
    /maturacao (?:aparente|progressiva|ordenada|preservada)/,
  ],
  heterogeneity: [
    /padrao (?:visual )?heterogene/,
    /populacao (?:nucleada )?heterogene/,
    /morfologia celular heterogene/,
    /mistura de (?:celulas|elementos) hematopoeticos/,
    /diversidade (?:celular|maturativa|de estagios)/,
  ],
  matureForms: [
    /formas? (?:granulociticas? )?maduras?/,
    /granulocitos? (?:maduros? )?(?:segmentados?|bilobados?)/,
    /neutrofilos? maduros?/,
  ],
  favorsMaturation: [
    /favorec(?:e|em|endo)[^.]{0,100}(?:contexto de )?maturacao medular/,
    /favorec(?:e|em|endo)[^.]{0,100}(?:precursor|hematopoese)/,
    /compativel com hematopoese medular/,
  ],
});

function cytologyCore(support = {}) {
  const keys = [
    "highNCRatio",
    "openFineChromatin",
    "nucleoli",
    "scantBasophilicCytoplasm",
  ];
  return keys.filter((key) => support[key] === true).length;
}

function structuredArchitectureScore(blast = {}) {
  const support = obj(blast.morphologySupport);
  const sub = obj(blast.blastoidSubpopulationContext);
  return [
    support.monomorphism === true,
    support.repeatedAcrossField === true,
    ["dominant", "repeated"].includes(text(blast.populationPattern).toLowerCase()),
    sub.distinctFromMaturationContinuum === true,
    sub.morphologicallyCoherent === true,
    sub.repeatedSubsetAcrossField === true,
    sub.disproportionateImmatureSubset === true,
  ].filter(Boolean).length;
}

export function assessMarrowNarrativeStructureContradiction(result = {}) {
  const blast = obj(result.blastAssessment);
  const support = obj(blast.morphologySupport);
  const sub = obj(blast.blastoidSubpopulationContext);
  const narrative = collectNarrative(result);

  const noDistinctBlastoidSubset = hasAny(narrative, NEGATION.noDistinctBlastoidSubset);
  const noMonomorphicBlastoidPopulation = hasAny(narrative, NEGATION.noMonomorphicBlastoidPopulation);
  const noSeparationFromContinuum = hasAny(narrative, NEGATION.noSeparationFromContinuum);
  const explicitBlastoidArchitectureNegation =
    noDistinctBlastoidSubset ||
    noMonomorphicBlastoidPopulation ||
    noSeparationFromContinuum;

  const physiologicContinuum = hasAny(narrative, PHYSIOLOGIC.continuum);
  const physiologicHeterogeneity = hasAny(narrative, PHYSIOLOGIC.heterogeneity);
  const matureFormsPresent = hasAny(narrative, PHYSIOLOGIC.matureForms);
  const narrativeFavorsMaturation = hasAny(narrative, PHYSIOLOGIC.favorsMaturation);
  const physiologicNarrativeSignalCount = [
    physiologicContinuum,
    physiologicHeterogeneity,
    matureFormsPresent,
    narrativeFavorsMaturation,
  ].filter(Boolean).length;

  const independentCytologyCoreCount = cytologyCore(support);
  const architectureScore = structuredArchitectureScore(blast);
  const approximateBlastLikeCells = finite(blast.approximateBlastLikeCells);
  const evidenceState = text(blast.evidenceState || "NOT_ASSESSABLE").toUpperCase();
  const explicitlyObserved = blast.observed === true || evidenceState === "OBSERVED_POPULATION";

  const structuredClaimsDistinct = sub.distinctFromMaturationContinuum === true;
  const structuredClaimsCoherent = sub.morphologicallyCoherent === true;
  const structuredClaimsRepeatedSubset = sub.repeatedSubsetAcrossField === true;
  const structuredClaimsMonomorphism = support.monomorphism === true;

  const structuredArchitectureConflict =
    explicitBlastoidArchitectureNegation &&
    (
      structuredClaimsDistinct ||
      structuredClaimsCoherent ||
      structuredClaimsRepeatedSubset ||
      structuredClaimsMonomorphism
    );

  const directPositiveCytologyProtection =
    independentCytologyCoreCount >= 2 &&
    (
      approximateBlastLikeCells == null ||
      approximateBlastLikeCells > 0 ||
      evidenceState === "OBSERVED_POPULATION"
    );

  const observedPopulationProtected =
    explicitlyObserved &&
    (directPositiveCytologyProtection || approximateBlastLikeCells > 0);

  const physiologicNarrativeDominance =
    physiologicNarrativeSignalCount >= 2 &&
    explicitBlastoidArchitectureNegation;

  const reconciledPromotion =
    blast.reconciledFromObservationNarrative === true ||
    obj(blast.evidenceReconciliation).requiresBlastEvidenceReconciliation === true ||
    obj(result.marrowBlastEvidenceReconciliation).requiresBlastEvidenceReconciliation === true;

  const weakIndependentBlastCytology = independentCytologyCoreCount < 2;
  const zeroOrUnknownBlastLikeCount = approximateBlastLikeCells == null || approximateBlastLikeCells <= 0;

  const suppressSuspiciousPromotion =
    !observedPopulationProtected &&
    evidenceState !== "OBSERVED_POPULATION" &&
    physiologicNarrativeDominance &&
    structuredArchitectureConflict &&
    weakIndependentBlastCytology &&
    zeroOrUnknownBlastLikeCount;

  return {
    version: MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
    narrativeAvailable: narrative.length > 0,
    explicitBlastoidArchitectureNegation,
    noDistinctBlastoidSubset,
    noMonomorphicBlastoidPopulation,
    noSeparationFromContinuum,
    physiologicContinuum,
    physiologicHeterogeneity,
    matureFormsPresent,
    narrativeFavorsMaturation,
    physiologicNarrativeSignalCount,
    physiologicNarrativeDominance,
    independentCytologyCoreCount,
    architectureScore,
    structuredArchitectureConflict,
    approximateBlastLikeCells,
    evidenceState,
    reconciledPromotion,
    directPositiveCytologyProtection,
    observedPopulationProtected,
    weakIndependentBlastCytology,
    suppressSuspiciousPromotion,
  };
}

export function resolveMarrowNarrativeStructureContradiction(result = {}) {
  if (!result || typeof result !== "object") return result;

  const out = {
    ...result,
    blastAssessment: {
      ...obj(result.blastAssessment),
      morphologySupport: {
        ...obj(obj(result.blastAssessment).morphologySupport),
      },
      precursorContext: {
        ...obj(obj(result.blastAssessment).precursorContext),
      },
      blastoidSubpopulationContext: {
        ...obj(obj(result.blastAssessment).blastoidSubpopulationContext),
      },
    },
  };

  const assessment = assessMarrowNarrativeStructureContradiction(out);
  out.marrowNarrativeStructureContradictionResolution = assessment;
  out.blastAssessment.narrativeStructureContradictionResolution = assessment;
  out.blastAssessment.narrativeStructureContradictionResolutionVersion =
    MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION;

  if (!assessment.suppressSuspiciousPromotion) {
    out.marrowPhysiologicDominanceRecovery = {
      version: MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION,
      active: false,
      positiveEvidenceProtected:
        assessment.observedPopulationProtected || assessment.directPositiveCytologyProtection,
      reason: assessment.observedPopulationProtected
        ? "OBSERVED_BLASTOID_POPULATION_PROTECTED"
        : assessment.directPositiveCytologyProtection
          ? "INDEPENDENT_BLAST_CYTOLOGY_PROTECTED"
          : "NO_QUALIFYING_NARRATIVE_STRUCTURE_CONTRADICTION",
    };
    return out;
  }

  const support = out.blastAssessment.morphologySupport;
  const precursor = out.blastAssessment.precursorContext;
  const sub = out.blastAssessment.blastoidSubpopulationContext;

  // Correct only the blastoid architecture claims contradicted by the model's
  // own observation narrative. Do not erase the fact that immature precursors
  // may repeat across the field.
  support.monomorphism = false;
  sub.distinctFromMaturationContinuum = false;
  sub.morphologicallyCoherent = false;
  sub.repeatedSubsetAcrossField = false;

  precursor.maturationHeterogeneity = true;
  precursor.maturationContinuum = true;
  precursor.matureFormsPresent = true;
  precursor.nonMonomorphicBackground = true;

  out.blastAssessment.evidenceState = "NOT_ASSESSABLE";
  out.blastAssessment.observed = null;
  out.blastAssessment.approximateBlastLikeCells = 0;
  out.blastAssessment.populationPattern = "heterogeneous";
  out.blastAssessment.lineageAssignable = false;
  out.blastAssessment.lineage = "indeterminate";
  out.blastAssessment.acquisitionEvidenceConflict = true;
  out.blastAssessment.structuredNarrativeDiscordance = true;
  out.blastAssessment.requiresBlastEvidenceReconciliation = false;
  out.blastAssessment.reconciledFromObservationNarrative = false;
  out.blastAssessment.physiologicDominanceRecovered = true;

  const priorReconciliation = obj(out.blastAssessment.evidenceReconciliation);
  out.blastAssessment.evidenceReconciliation = {
    ...priorReconciliation,
    strongNarrativeBlastoidEvidence: false,
    requiresBlastEvidenceReconciliation: false,
    narrativeStructureResolutionVersion:
      MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
    suspiciousPromotionSuppressed: true,
  };

  out.marrowBlastEvidenceReconciliation = {
    ...obj(out.marrowBlastEvidenceReconciliation),
    strongNarrativeBlastoidEvidence: false,
    requiresBlastEvidenceReconciliation: false,
    narrativeStructureResolutionVersion:
      MARROW_NARRATIVE_STRUCTURE_CONTRADICTION_VERSION,
    suspiciousPromotionSuppressed: true,
  };

  out.marrowPhysiologicDominanceRecovery = {
    version: MARROW_PHYSIOLOGIC_DOMINANCE_RECOVERY_VERSION,
    active: true,
    physiologicNarrativeDominance: true,
    positiveEvidenceProtected: false,
    suspiciousPromotionSuppressed: true,
    recoveredEvidenceState: "NOT_ASSESSABLE",
    recoveredPopulationPattern: "heterogeneous",
    reason:
      "EXPLICIT_BLASTOID_ARCHITECTURE_NEGATION_PLUS_PHYSIOLOGIC_CONTINUUM_WITH_WEAK_INDEPENDENT_BLAST_CYTOLOGY",
  };

  return out;
}

export default resolveMarrowNarrativeStructureContradiction;
