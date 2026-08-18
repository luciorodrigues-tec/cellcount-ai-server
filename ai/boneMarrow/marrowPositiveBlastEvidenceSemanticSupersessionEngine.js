// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.44 — MARROW POSITIVE BLAST EVIDENCE SEMANTIC SUPERSESSION
//
// Purpose:
// A legacy focal positive flag must not outrank a later, stronger morphologic
// discrimination showing pathologic myeloid expansion with maturation and no
// distinct/coherent/repeated blastoid subpopulation.
//
// Safety invariants:
// - never suppress OBSERVED_POPULATION;
// - never suppress SUSPICIOUS_POPULATION with qualified blastoid architecture;
// - never convert NOT_ASSESSABLE to blast-negative exclusion;
// - preserve focal cytology as contextualized evidence;
// - never diagnose CML/LMC/MPN/BCR::ABL1 from morphology alone.
// ============================================================================

export const MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION =
  "BE-FIX-005.50.15.5";

export const MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION =
  "BE-FIX-005.50.15.5";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function upper(value) {
  return text(value).toUpperCase();
}

function bool(value) {
  return value === true;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function firstObject(...values) {
  return values.find(
    (value) => value && typeof value === "object" && !Array.isArray(value),
  ) || {};
}

export function evaluateMarrowPositiveBlastEvidenceSemanticSupersession(
  result = {},
) {
  const expansion = firstObject(
    result?.marrowMyeloidExpansionDiscrimination,
    result?.rawResponse?.marrowMyeloidExpansionDiscrimination,
  );

  const expansionLock = firstObject(
    result?.marrowPathologicMaturationContinuumLock,
    result?.rawResponse?.marrowPathologicMaturationContinuumLock,
  );

  const precursor = firstObject(
    result?.marrowPrecursorDiscrimination,
    result?.marrowBlastPopulationEvidence?.precursorDiscrimination,
    result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.precursorDiscrimination,
    result?.rawResponse?.marrowPrecursorDiscrimination,
  );

  const recovered = obj(result?.marrowRecoveredCytologyProjection);
  const focalGate = obj(result?.marrowFocalCytologyContextualization);
  const rawBlast = obj(result?.rawResponse?.blastAssessment);
  const directBlast = obj(result?.blastAssessment);
  const lmeBlast = obj(
    result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence,
  );

  const state = upper(
    directBlast.evidenceState ||
    rawBlast.evidenceState ||
    lmeBlast.evidenceState,
  );

  const classification =
    expansion.classification ||
    expansionLock.classification ||
    precursor.classification ||
    "";

  const protectedExpansion =
    classification === "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" &&
    (
      expansion.pathologicMyeloidExpansionSupported === true ||
      expansionLock.active === true ||
      precursor.pathologicMyeloidExpansionProtected === true
    );

  const sub = obj(precursor.blastoidSubpopulationSignals);
  const dual = obj(precursor.dualAxis);

  const observedQualified =
    precursor.protectedObservedBlastoid === true ||
    dual.observedEscalation === true ||
    state === "OBSERVED_POPULATION";

  const suspiciousArchitectureQualified =
    precursor.protectedSuspiciousBlastoid === true ||
    dual.suspiciousEscalation === true ||
    (
      sub.distinctFromMaturationContinuum === true &&
      sub.morphologicallyCoherent === true &&
      (
        sub.repeatedSubsetAcrossField === true ||
        sub.repeatedAcrossField === true
      )
    );

  const structuredArchitecture =
    precursor.coherentBlastoidSubpopulation === true ||
    precursor.strongBlastoidPattern === true ||
    sub.structuredPathologicSubset === true ||
    recovered.architectureQualified === true ||
    recovered.structuredPositive === true ||
    focalGate.architectureQualified === true ||
    expansion.structuredPathologicSubset === true ||
    expansionLock.blastoidPopulationSupported === true;

  const explicitlyWithinContinuum =
    precursor.explicitlyNotDistinctFromContinuum === true ||
    sub.distinctFromMaturationContinuum === false ||
    recovered.distinctFromMaturationContinuum === false;

  const architectureAbsent =
    !observedQualified &&
    !suspiciousArchitectureQualified &&
    !structuredArchitecture &&
    (
      precursor.blastArchitectureScore === 0 ||
      expansion?.blastArchitecture?.architectureScore === 0 ||
      recovered.architectureQualified === false ||
      focalGate.architectureQualified === false
    );

  const focalOnly =
    state === "FOCAL_SUSPICION" ||
    (
      lmeBlast.positive === true &&
      bool(lmeBlast.repeated) === false &&
      (num(lmeBlast.approximateBlastLikeCells) ?? 0) <= 2
    );

  const populationInferenceAllowed =
    result?.fieldAdequacy?.populationInferenceAllowed !== false;
  const focalPopulationScopeBlocked =
    focalOnly &&
    !populationInferenceAllowed &&
    !observedQualified &&
    !suspiciousArchitectureQualified &&
    !structuredArchitecture;

  const approximateBlastLikeCells =
    num(directBlast.approximateBlastLikeCells) ??
    num(rawBlast.approximateBlastLikeCells) ??
    num(lmeBlast.approximateBlastLikeCells);

  // BE-FIX-005.50.13 — physiologic maturation vs blastoid architecture
  // contradiction lock. Suspicious architecture alone must not manufacture a
  // structured blastoid population when the evidence explicitly places the
  // cells inside a maturation continuum, no blast-like cells are counted, no
  // observed blast population exists, and no independent structured
  // architecture is present.
  const unresolvedImmatureCandidateAfterAcquisition =
    result?.marrowMaturationContinuumDiscrimination
      ?.unresolvedImmatureCandidateAfterAcquisition === true;

  const physiologicMaturationContradiction =
    unresolvedImmatureCandidateAfterAcquisition !== true &&
    explicitlyWithinContinuum === true &&
    observedQualified === false &&
    structuredArchitecture === false &&
    (approximateBlastLikeCells ?? 0) === 0 &&
    (
      state === "PHYSIOLOGIC_PRECURSOR_PATTERN" ||
      precursor.strongPhysiologicPattern === true ||
      precursor.maturationContinuumSupported === true ||
      result?.marrowResidualBlastSemanticCleanup?.maturationContinuumSupported === true ||
      result?.marrowMyeloidExpansionDiscrimination?.maturationContinuumSupported === true
    );

  const active =
    (
      protectedExpansion &&
      focalOnly &&
      architectureAbsent &&
      explicitlyWithinContinuum
    ) ||
    physiologicMaturationContradiction;

  const supersessionMode = physiologicMaturationContradiction
    ? "PHYSIOLOGIC_MATURATION_CONTRADICTION_LOCK"
    : active
      ? "EXPANSION_WITH_MATURATION_SUPERSESSION"
      : "NONE";

  return {
    version: MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
    active,
    priorEvidenceState: state || null,
    effectivePopulationEvidenceState: active
      ? "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION"
      : (state || "NOT_ASSESSABLE"),
    protectedExpansion,
    focalOnly,
    architectureAbsent,
    explicitlyWithinContinuum,
    observedQualified,
    suspiciousArchitectureQualified,
    structuredArchitecture,
    approximateBlastLikeCells,
    focalCytologyPreserved:
      active && approximateBlastLikeCells !== null && approximateBlastLikeCells > 0,
    unresolvedImmatureCandidateAfterAcquisition,
    physiologicMaturationContradiction,
    supersessionMode,
    populationInferenceAllowed,
    focalPopulationScopeBlocked,
    populationPositiveAllowed:
      !active &&
      !focalPopulationScopeBlocked &&
      (
        observedQualified ||
        suspiciousArchitectureQualified ||
        structuredArchitecture ||
        (!focalOnly && populationInferenceAllowed)
      ),
    focalCytologyPopulationScopeLockVersion: "BE-FIX-005.50.15.5",
    negativeBlastExclusionAllowed: false,
    reason: physiologicMaturationContradiction
      ? "Suspicious architecture is not sufficient to establish a structured blastoid population when morphology is explicitly within a physiologic maturation continuum, no blast-like cells are counted, no observed blast population exists, and no independent structured architecture is present."
      : active
        ? "Legacy focal blast-like cytology is preserved as focal morphology but is semantically superseded as population-level blast evidence by protected pathologic myeloid expansion with maturation and absent blastoid architecture."
        : "No semantic supersession applied.",
  };
}

export function applyMarrowPositiveBlastEvidenceSemanticSupersession(
  result = {},
) {
  if (!result || typeof result !== "object") return result;

  const decision =
    evaluateMarrowPositiveBlastEvidenceSemanticSupersession(result);

  const out = {
    ...result,
    marrowPositiveBlastEvidenceSemanticSupersession: decision,
  };

  if (!decision.active) {
    return out;
  }

  if (decision.physiologicMaturationContradiction === true) {
    out.findings = {
      ...obj(out.findings),
      blastSuspicion: false,
      blastEvidenceState: "PHYSIOLOGIC_PRECURSOR_PATTERN",
    };

    if (out.marrowBlastPopulationEvidence) {
      out.marrowBlastPopulationEvidence = {
        ...obj(out.marrowBlastPopulationEvidence),
        priorEvidenceState:
          out.marrowBlastPopulationEvidence.priorEvidenceState ||
          out.marrowBlastPopulationEvidence.evidenceState ||
          decision.priorEvidenceState,
        evidenceState: "PHYSIOLOGIC_PRECURSOR_PATTERN",
        positivePopulationFinding: false,
        observedPopulation: false,
        suspiciousPopulation: false,
        focalSuspicion: false,
        semanticSupersessionVersion:
          MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
      };
    }

    const lme = obj(out.localMorphologyEvidence);
    const marrow = obj(lme.marrow);
    const lmeBlast = obj(marrow.blastPopulationEvidence);
    out.localMorphologyEvidence = {
      ...lme,
      marrow: {
        ...marrow,
        blastPopulationEvidence: {
          ...lmeBlast,
          priorEvidenceState:
            lmeBlast.priorEvidenceState ||
            lmeBlast.evidenceState ||
            decision.priorEvidenceState,
          evidenceState: "PHYSIOLOGIC_PRECURSOR_PATTERN",
          positive: false,
          positivePopulationFinding: false,
          observedPopulation: false,
          suspiciousPopulation: false,
          focalSuspicion: false,
          semanticSupersessionVersion:
            MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
        },
      },
    };

    out.marrowFinalBlastProjectionLock = {
      ...obj(out.marrowFinalBlastProjectionLock),
      version: MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION,
      active: true,
      populationBlastSuspicion: false,
      focalCytologyPreserved: false,
      globalBlastExclusionAllowed: false,
      physiologicMaturationContradictionLocked: true,
      dominantPattern:
        out.globalPattern?.dominantPattern ||
        "MARROW_PHYSIOLOGIC_MATURATION_LIMITED_PATTERN",
    };

    return out;
  }

  out.findings = {
    ...obj(out.findings),
    blastSuspicion: false,
    immatureCells: false,
    focalImmatureCytologyObserved:
      decision.focalCytologyPreserved === true,
    blastEvidenceState:
      "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION",
  };

  const lme = obj(out.localMorphologyEvidence);
  const marrow = obj(lme.marrow);
  const lmeBlast = obj(marrow.blastPopulationEvidence);

  out.localMorphologyEvidence = {
    ...lme,
    marrow: {
      ...marrow,
      blastPopulationEvidence: {
        ...lmeBlast,
        priorEvidenceState:
          lmeBlast.priorEvidenceState ||
          lmeBlast.evidenceState ||
          decision.priorEvidenceState,
        evidenceState:
          "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION",
        positive: false,
        positivePopulationFinding: false,
        observedPopulation: false,
        suspiciousPopulation: false,
        focalSuspicion: false,
        focalCytologyPreserved: true,
        semanticSupersessionVersion:
          MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
      },
    },
  };

  if (out.marrowBlastPopulationEvidence) {
    out.marrowBlastPopulationEvidence = {
      ...obj(out.marrowBlastPopulationEvidence),
      priorEvidenceState:
        out.marrowBlastPopulationEvidence.priorEvidenceState ||
        out.marrowBlastPopulationEvidence.evidenceState ||
        decision.priorEvidenceState,
      evidenceState:
        "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION",
      positivePopulationFinding: false,
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: false,
      semanticSupersessionVersion:
        MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
    };
  }

  out.fieldAdequacy = {
    ...obj(out.fieldAdequacy),
    positiveBlastEvidenceOverride: {
      ...obj(obj(out.fieldAdequacy).positiveBlastEvidenceOverride),
      active: false,
      semanticallySuperseded: true,
      semanticSupersessionVersion:
        MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
      principle:
        "FOCAL_CYTOLOGY_IS_PRESERVED_BUT_DOES_NOT_CONSTITUTE_POSITIVE_BLASTOID_POPULATION_WITHOUT_QUALIFIED_ARCHITECTURE",
    },
  };

  const finding =
    out.mainFinding ||
    out.primaryFinding ||
    out.finalConclusion ||
    "Expansão mieloide/granulocítica com amplo espectro maturativo, sem subpopulação blastoide distinta/coerente/repetida sustentada no campo.";

  out.finalClassification =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  out.morphologicRiskClass =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  out.riskLevel =
    "Expansão mieloide/granulocítica relevante com maturação preservada";
  out.normalityBlocked = true;
  out.requiresHumanReview = true;

  out.patternRecognition = {
    ...obj(out.patternRecognition),
    overallPattern:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  };

  out.globalPattern = {
    ...obj(out.globalPattern),
    dominantPattern:
      "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
    marrowPositiveBlastEvidence: false,
    pathologicMyeloidExpansionPattern: true,
    blastAssessmentState: "NOT_ASSESSABLE_FOR_GLOBAL_EXCLUSION",
    focalCytologyPreserved: true,
    marrowPositiveBlastEvidenceSemanticSupersessionVersion:
      MARROW_POSITIVE_BLAST_EVIDENCE_SEMANTIC_SUPERSESSION_VERSION,
  };

  out.overallAssessment = {
    ...obj(out.overallAssessment),
    requiresHumanReview: true,
    riskCategory:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
    mainImpression: finding,
  };

  out.structuredReport = {
    ...obj(out.structuredReport),
    conclusion: finding,
  };

  out.mainFinding = finding;
  out.primaryFinding = finding;
  out.finalConclusion = finding;

  out.marrowFinalBlastProjectionLock = {
    version: MARROW_FINAL_BLAST_PROJECTION_LOCK_VERSION,
    active: true,
    populationBlastSuspicion: false,
    focalCytologyPreserved: true,
    globalBlastExclusionAllowed: false,
    dominantPattern:
      "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN",
  };

  return out;
}

export default applyMarrowPositiveBlastEvidenceSemanticSupersession;
