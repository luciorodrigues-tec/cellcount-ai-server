// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.47 — TERMINAL MARROW MORPHOLOGY / ADEQUACY AXIS PROJECTION LOCK
//
// Purpose:
// Limited-field adequacy may constrain confidence, global inference and
// exclusion, but it must not replace a provenance-qualified positive marrow
// morphology already selected by the final marrow authority.
//
// Safety invariants:
// - preserve CLASS_1_LIMITED_FIELD as ADEQUACY metadata;
// - preserve terminal positive marrow morphology as MORPHOLOGY metadata;
// - never suppress true structured blastoid populations;
// - never fabricate global blast absence;
// - never diagnose CML/LMC/MPN/BCR::ABL1 from morphology alone.
// ============================================================================

export const MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION =
  "BE-FIX-005.50.13";

export const MARROW_LIMITED_FIELD_AXIS_NON_OVERRIDE_VERSION =
  "BE-FIX-005.50.13";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

export function evaluateMarrowMorphologyAdequacyProjectionLock(result = {}) {
  const authority = obj(result.finalMarrowAuthority);
  const axis = obj(result.marrowAdequacyMorphologyAxis);
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const globalPattern = obj(result.globalPattern);
  const field = obj(result.fieldAdequacy);
  const findings = obj(result.findings);

  const limitedField =
    field.limitedField === true ||
    field.adequateForPopulationAssessment === false ||
    field.populationInferenceAllowed === false ||
    axis.adequacyClassification === "CLASS_1_LIMITED_FIELD";

  const morphologyClassification =
    axis.morphologyClassification ||
    authority.morphologyClassification ||
    result.finalClassification ||
    null;

  const protectedExpansion =
    (
      morphologyClassification ===
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
      expansion.classification ===
        "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
      globalPattern.dominantPattern ===
        "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION"
    ) &&
    (
      authority.applyExpansionAuthority === true ||
      expansion.pathologicMyeloidExpansionSupported === true ||
      result.marrowPathologicMaturationContinuumLock?.active === true
    );

  const physiologicMaturationContradiction =
    authority.structuredBlast?.physiologicMaturationContradiction === true ||
    result.marrowPositiveBlastEvidenceSemanticSupersession?.physiologicMaturationContradiction === true;

  const trueBlastoid =
    authority.structuredBlast?.observed === true ||
    (
      authority.structuredBlast?.suspicious === true &&
      authority.structuredBlast?.structured === true &&
      !physiologicMaturationContradiction
    ) ||
    result.marrowBlastPopulationEvidence?.observedPopulation === true ||
    (
      result.marrowBlastPopulationEvidence?.suspiciousPopulation === true &&
      !physiologicMaturationContradiction
    ) ||
    result.marrowPrecursorDiscrimination?.protectedObservedBlastoid === true ||
    (
      result.marrowPrecursorDiscrimination?.protectedSuspiciousBlastoid === true &&
      !physiologicMaturationContradiction
    );

  const positiveMarrowMorphology =
    trueBlastoid ||
    protectedExpansion ||
    (
      typeof morphologyClassification === "string" &&
      morphologyClassification.startsWith("MARROW_") &&
      morphologyClassification !== "MARROW_INDETERMINATE"
    );

  return {
    version: MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
    active: limitedField && positiveMarrowMorphology,
    limitedField,
    positiveMarrowMorphology,
    protectedExpansion,
    trueBlastoid,
    physiologicMaturationContradiction,
    morphologyClassification,
    adequacyClassification: limitedField
      ? "CLASS_1_LIMITED_FIELD"
      : "POPULATION_ASSESSABLE",
    populationInferenceAllowed: field.populationInferenceAllowed !== false,
    globalNegativeExclusionAllowed:
      field.globalNegativeExclusionAllowed === true,
    blastSuspicion:
      findings.blastSuspicion === true,
  };
}

export function applyMarrowMorphologyAdequacyProjectionLock(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluateMarrowMorphologyAdequacyProjectionLock(result);

  const out = {
    ...result,
    overallAssessment: { ...obj(result.overallAssessment) },
    evidenceGovernance: { ...obj(result.evidenceGovernance) },
    finalMarrowAuthority: { ...obj(result.finalMarrowAuthority) },
    marrowAdequacyMorphologyAxis: {
      ...obj(result.marrowAdequacyMorphologyAxis),
      version: MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
      morphologyClassification: decision.morphologyClassification,
      adequacyClassification: decision.adequacyClassification,
      limitedField: decision.limitedField,
      morphologyOverridesAdequacy: decision.active,
    },
    marrowTerminalMorphologyAdequacyProjectionLock: decision,
  };

  if (!decision.active) {
    return out;
  }

  // True blastoid morphology remains authoritative when actually structured.
  if (decision.trueBlastoid) {
    const cls =
      result.finalMarrowAuthority?.structuredBlast?.observed === true ||
      result.marrowBlastPopulationEvidence?.observedPopulation === true
        ? "MARROW_BLASTOID_POPULATION_OBSERVED"
        : "MARROW_BLASTOID_POPULATION_SUSPICIOUS";

    out.finalClassification = cls;
    out.morphologicRiskClass = cls;
    out.overallAssessment.riskCategory = cls;
  } else if (decision.protectedExpansion) {
    const cls = "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
    out.finalClassification = cls;
    out.morphologicRiskClass = cls;
    out.overallAssessment.riskCategory = cls;
  } else if (decision.morphologyClassification) {
    out.finalClassification = decision.morphologyClassification;
    out.morphologicRiskClass = decision.morphologyClassification;
    out.overallAssessment.riskCategory =
      decision.morphologyClassification;
  }

  // Adequacy stays explicit and restrictive without replacing morphology.
  out.evidenceGovernance.limitedField = decision.limitedField;
  out.evidenceGovernance.evidenceScope = decision.limitedField
    ? "FIELD_SCOPED"
    : out.evidenceGovernance.evidenceScope;
  out.evidenceGovernance.adequacyClassification =
    decision.adequacyClassification;
  out.evidenceGovernance.populationInferenceAllowed =
    result.fieldAdequacy?.populationInferenceAllowed !== false;
  out.evidenceGovernance.globalNegativeExclusionAllowed =
    result.fieldAdequacy?.globalNegativeExclusionAllowed === true;

  out.finalMarrowAuthority = {
    ...out.finalMarrowAuthority,
    terminalProjectionLockVersion:
      MARROW_TERMINAL_MORPHOLOGY_ADEQUACY_PROJECTION_LOCK_VERSION,
    morphologyClassification: out.finalClassification,
    adequacyClassification: decision.adequacyClassification,
    limitedField: decision.limitedField,
    morphologyAdequacyAxisLocked: true,
  };

  return out;
}

export default applyMarrowMorphologyAdequacyProjectionLock;
