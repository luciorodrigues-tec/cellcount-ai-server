// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.3 — RESIDUAL BLAST SEMANTIC CLEANUP
//
// Purpose:
//   A marrow may contain numerous immature granulocytic precursors as part of
//   a pathologic myeloid expansion with maturation. Legacy/repair stages can
//   leave a population-level "blastoid suspicion" token behind even after the
//   terminal architecture says there is no distinct/coherent/structured
//   blastoid subset.
//
// Safety invariants:
// - never suppress a true OBSERVED blastoid population;
// - never suppress a SUSPICIOUS population with qualified architecture;
// - preserve focal/immature cytology as local evidence;
// - never convert semantic cleanup into a global blast-negative conclusion;
// - never diagnose CML/LMC/MPN/BCR::ABL1 from morphology alone.
// ============================================================================

export const MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION =
  "BE-FIX-005.50.3";

export const MARROW_IMMATURITY_MATURATION_SEMANTIC_SEPARATION_VERSION =
  "BE-FIX-005.50.3";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function firstState(result = {}) {
  return upper(
    result?.findings?.blastEvidenceState ||
    result?.blastAssessment?.evidenceState ||
    result?.marrowBlastPopulationEvidence?.evidenceState ||
    result?.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.evidenceState ||
    result?.rawResponse?.blastAssessment?.evidenceState,
  );
}

function isResidualSuspicionState(state = "") {
  const normalized = upper(state).replace(/[^A-Z0-9]+/g, "_");
  return (
    normalized.includes("SUSPICIOUS") ||
    normalized.includes("POSITIVE_MORPHOLOGIC_SUSPICION") ||
    normalized.includes("FOCAL_SUSPICION") ||
    normalized.includes("IMMATURE_BLASTOID")
  );
}

function qualifiedBlastArchitecture(result = {}) {
  const authority = obj(result.finalMarrowAuthority);
  const terminal = obj(authority.structuredBlast);
  const population = obj(result.marrowBlastPopulationEvidence);
  const precursor = obj(result.marrowPrecursorDiscrimination);
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const blastArchitecture = obj(expansion.blastArchitecture);
  const precursorSub = obj(precursor.blastoidSubpopulationSignals);

  const observed =
    terminal.observed === true ||
    population.observedPopulation === true ||
    precursor.protectedObservedBlastoid === true;

  const coherentRepeatedDistinct =
    blastArchitecture.distinct === true &&
    blastArchitecture.coherent === true &&
    blastArchitecture.repeated === true;

  const precursorQualified =
    precursorSub.distinctFromMaturationContinuum === true &&
    precursorSub.morphologicallyCoherent === true &&
    (
      precursorSub.repeatedSubsetAcrossField === true ||
      precursorSub.repeatedAcrossField === true
    );

  const suspicious =
    terminal.suspicious === true && terminal.structured === true ||
    precursor.protectedSuspiciousBlastoid === true ||
    precursorQualified ||
    (
      population.suspiciousPopulation === true &&
      (
        population.structuredPathologicSubset === true ||
        coherentRepeatedDistinct
      )
    );

  const structured =
    terminal.structured === true ||
    population.structuredPathologicSubset === true ||
    precursor.structuredPathologicSubset === true ||
    expansion.structuredPathologicSubset === true ||
    coherentRepeatedDistinct ||
    precursorQualified;

  return {
    observed,
    suspicious,
    structured,
    qualified: observed || suspicious || structured,
    coherentRepeatedDistinct,
    precursorQualified,
  };
}

export function evaluateMarrowResidualBlastSemanticCleanup(result = {}) {
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const lock = obj(result.marrowPathologicMaturationContinuumLock);
  const authority = obj(result.finalMarrowAuthority);
  const architecture = qualifiedBlastArchitecture(result);
  const priorEvidenceState = firstState(result);

  const protectedExpansion =
    (
      expansion.classification === "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
      result.finalClassification === "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
      result.morphologicRiskClass === "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
      authority.protectedExpansion === true
    ) &&
    (
      expansion.pathologicMyeloidExpansionSupported === true ||
      lock.active === true ||
      authority.protectedExpansion === true
    );

  const maturationContinuumSupported =
    expansion.maturationContinuum === true ||
    expansion.structuredMaturationPresent === true ||
    expansion.maturationAxis === true ||
    lock.active === true;

  const residualSuspicion =
    isResidualSuspicionState(priorEvidenceState) ||
    result?.findings?.blastSuspicion === true ||
    result?.marrowBlastPopulationEvidence?.suspiciousPopulation === true;

  const active =
    protectedExpansion &&
    maturationContinuumSupported &&
    residualSuspicion &&
    architecture.qualified !== true;

  return {
    version: MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
    active,
    protectedExpansion,
    maturationContinuumSupported,
    priorEvidenceState: priorEvidenceState || null,
    effectivePopulationEvidenceState: active
      ? "IMMATURE_CYTOLOGY_WITHIN_PATHOLOGIC_MYELOID_MATURATION"
      : (priorEvidenceState || "NOT_ASSESSABLE"),
    architecture,
    residualSuspicion,
    cytologyPreserved: active,
    populationBlastSuspicionAllowed: !active,
    globalBlastNegativeExclusionAllowed: false,
    reason: active
      ? "Residual blastoid population semantics were cleared because terminal marrow evidence supports pathologic myeloid expansion with maturation and no qualified distinct/coherent/structured blastoid architecture. Immature cytology remains preserved as field-scoped evidence."
      : "No residual blast semantic cleanup applied.",
  };
}

export function applyMarrowResidualBlastSemanticCleanup(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluateMarrowResidualBlastSemanticCleanup(result);
  const out = {
    ...result,
    marrowResidualBlastSemanticCleanup: decision,
  };

  if (!decision.active) return out;

  const state = "IMMATURE_CYTOLOGY_WITHIN_PATHOLOGIC_MYELOID_MATURATION";

  out.findings = {
    ...obj(out.findings),
    blastSuspicion: false,
    immatureCells: false,
    blastEvidenceState: state,
    immatureCytologyPreservedWithinMaturation: true,
  };

  if (out.blastAssessment && typeof out.blastAssessment === "object") {
    out.blastAssessment = {
      ...obj(out.blastAssessment),
      priorEvidenceState:
        out.blastAssessment.priorEvidenceState ||
        out.blastAssessment.evidenceState ||
        decision.priorEvidenceState,
      evidenceState: state,
      globalAbsenceAllowed: false,
      semanticCleanupVersion: MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
    };
  }

  if (out.marrowBlastPopulationEvidence) {
    out.marrowBlastPopulationEvidence = {
      ...obj(out.marrowBlastPopulationEvidence),
      priorEvidenceState:
        out.marrowBlastPopulationEvidence.priorEvidenceState ||
        out.marrowBlastPopulationEvidence.evidenceState ||
        decision.priorEvidenceState,
      evidenceState: state,
      positivePopulationFinding: false,
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: false,
      residualImmatureCytologyPreserved: true,
      semanticCleanupVersion: MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
    };
  }

  const lme = obj(out.localMorphologyEvidence);
  const marrow = obj(lme.marrow);
  const lmeBlast = obj(marrow.blastPopulationEvidence);

  if (Object.keys(lmeBlast).length > 0) {
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
          evidenceState: state,
          positive: false,
          positivePopulationFinding: false,
          observedPopulation: false,
          suspiciousPopulation: false,
          focalSuspicion: false,
          residualImmatureCytologyPreserved: true,
          semanticCleanupVersion: MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
        },
      },
    };
  }

  out.globalPattern = {
    ...obj(out.globalPattern),
    marrowPositiveBlastEvidence: false,
    blastAssessmentIndeterminate: true,
    blastAssessmentState: state,
    focalCytologyPreserved: true,
    globalBlastNegativeExclusionAllowed: false,
    marrowResidualBlastSemanticCleanupVersion:
      MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
  };

  out.fieldAdequacy = {
    ...obj(out.fieldAdequacy),
    adequateForBlastScreening:
      out.fieldAdequacy?.adequateForBlastScreening === true,
    residualBlastSemanticCleanup: {
      version: MARROW_RESIDUAL_BLAST_SEMANTIC_CLEANUP_VERSION,
      populationSuspicionCleared: true,
      cytologyPreserved: true,
      globalNegativeExclusionAllowed: false,
    },
  };

  return out;
}

export default applyMarrowResidualBlastSemanticCleanup;
