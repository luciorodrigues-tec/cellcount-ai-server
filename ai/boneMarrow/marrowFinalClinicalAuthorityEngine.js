// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.46 — FINAL MARROW AUTHORITY / POST-LEGACY RECONCILIATION
//
// Purpose:
// Establish one terminal marrow authority after legacy recovery/safety writers.
// Representativity (limited field) remains a separate axis and must not replace
// the dominant marrow morphology. Legacy raw flags may preserve evidence, but
// they may not resurrect population-level blast suspicion after 005.38/005.44
// have established protected myeloid expansion with maturation.
//
// Safety invariants:
// - never suppress OBSERVED_POPULATION;
// - never suppress a qualified SUSPICIOUS_POPULATION;
// - never erase focal cytology from protected evidence namespaces;
// - never convert limited representativity into global blast absence;
// - never diagnose CML/LMC/MPN/BCR::ABL1 from morphology alone.
// ============================================================================

export const MARROW_FINAL_CLINICAL_AUTHORITY_VERSION = "BE-FIX-005.46";
export const MARROW_POST_LEGACY_RECONCILIATION_VERSION = "BE-FIX-005.46";
export const MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION = "BE-FIX-005.46";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function uniqueStrings(values = []) {
  return [...new Set(
    values
      .filter((v) => typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean),
  )];
}

function evaluateStructuredBlastAuthority(result = {}) {
  const marrowEvidence = obj(result.marrowBlastPopulationEvidence);
  const precursor = obj(
    result.marrowPrecursorDiscrimination ||
    result.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.precursorDiscrimination,
  );
  const recovered = obj(result.marrowRecoveredCytologyProjection);
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const expansionLock = obj(result.marrowPathologicMaturationContinuumLock);
  const finalLock = obj(result.marrowFinalBlastProjectionLock);
  const sub = obj(precursor.blastoidSubpopulationSignals);
  const dual = obj(precursor.dualAxis);

  const evidenceState = upper(
    marrowEvidence.evidenceState ||
    result.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.evidenceState ||
    result.rawResponse?.blastAssessment?.evidenceState,
  );

  const observed =
    marrowEvidence.observedPopulation === true ||
    precursor.protectedObservedBlastoid === true ||
    dual.observedEscalation === true ||
    evidenceState === "OBSERVED_POPULATION";

  const suspicious =
    marrowEvidence.suspiciousPopulation === true ||
    precursor.protectedSuspiciousBlastoid === true ||
    (
      dual.suspiciousEscalation === true &&
      precursor.architectureProvenanceQualified !== false
    ) ||
    (
      sub.distinctFromMaturationContinuum === true &&
      sub.morphologicallyCoherent === true &&
      (
        sub.repeatedSubsetAcrossField === true ||
        sub.repeatedAcrossField === true
      )
    );

  const structured =
    observed ||
    suspicious ||
    precursor.coherentBlastoidSubpopulation === true ||
    recovered.structuredPositive === true ||
    recovered.architectureQualified === true ||
    expansion.structuredPathologicSubset === true ||
    expansionLock.blastoidPopulationSupported === true ||
    finalLock.populationBlastSuspicion === true;

  return {
    observed,
    suspicious,
    structured,
    evidenceState: evidenceState || null,
  };
}

export function evaluateFinalMarrowAuthority(result = {}) {
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const expansionLock = obj(result.marrowPathologicMaturationContinuumLock);
  const supersession = obj(result.marrowPositiveBlastEvidenceSemanticSupersession);
  const finalBlastLock = obj(result.marrowFinalBlastProjectionLock);
  const globalPattern = obj(result.globalPattern);
  const field = obj(result.fieldAdequacy);
  const adequacy = obj(result.adequacyAssessment);

  const structuredBlast = evaluateStructuredBlastAuthority(result);

  const expansionClassification =
    expansion.classification ||
    expansionLock.classification ||
    result.finalClassification ||
    "";

  const protectedExpansion =
    (
      expansionClassification === "PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION" ||
      result.finalClassification === "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN" ||
      globalPattern.dominantPattern ===
        "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION"
    ) &&
    (
      expansion.pathologicMyeloidExpansionSupported === true ||
      expansionLock.active === true ||
      result.marrowDominantPatternStateReconciliation?.active === true ||
      supersession.active === true ||
      finalBlastLock.dominantPattern ===
        "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN"
    );

  const blastPopulationExcludedByAuthority =
    finalBlastLock.active === true &&
    finalBlastLock.populationBlastSuspicion === false;

  const limitedField =
    field.limitedField === true ||
    field.adequateForPopulationAssessment === false ||
    field.populationInferenceAllowed === false ||
    adequacy.classification === "LIMITED_FIELD" ||
    result.morphologicRiskClass === "CLASS_1_LIMITED_FIELD";

  const applyExpansionAuthority =
    protectedExpansion &&
    !structuredBlast.structured &&
    blastPopulationExcludedByAuthority;

  return {
    version: MARROW_FINAL_CLINICAL_AUTHORITY_VERSION,
    active: applyExpansionAuthority || structuredBlast.structured,
    applyExpansionAuthority,
    protectedExpansion,
    structuredBlast,
    blastPopulationExcludedByAuthority,
    limitedField,
    morphologyClassification: applyExpansionAuthority
      ? "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN"
      : structuredBlast.observed
        ? "MARROW_BLASTOID_POPULATION_OBSERVED"
        : structuredBlast.suspicious
          ? "MARROW_BLASTOID_POPULATION_SUSPICIOUS"
          : null,
    adequacyClassification: limitedField
      ? "CLASS_1_LIMITED_FIELD"
      : "POPULATION_ASSESSABLE",
  };
}

export function applyFinalMarrowAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;

  const authority = evaluateFinalMarrowAuthority(result);

  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    overallAssessment: { ...obj(result.overallAssessment) },
    structuredReport: { ...obj(result.structuredReport) },
    morphologyAnalysis: { ...obj(result.morphologyAnalysis) },
    patternRecognition: { ...obj(result.patternRecognition) },
    confidenceAnalysis: { ...obj(result.confidenceAnalysis) },
    finalMarrowAuthority: authority,
    marrowAdequacyMorphologyAxis: {
      version: MARROW_ADEQUACY_MORPHOLOGY_AXIS_SEPARATION_VERSION,
      morphologyClassification: authority.morphologyClassification,
      adequacyClassification: authority.adequacyClassification,
      limitedField: authority.limitedField,
    },
  };

  // True structured blast evidence always outranks expansion authority.
  if (authority.structuredBlast.observed || authority.structuredBlast.suspicious) {
    const observed = authority.structuredBlast.observed === true;
    const cls = observed
      ? "MARROW_BLASTOID_POPULATION_OBSERVED"
      : "MARROW_BLASTOID_POPULATION_SUSPICIOUS";
    const finding = observed
      ? "População blastoide/imatura medular observada com evidência estruturada. Requer revisão hematológica especializada e correlação clínico-laboratorial."
      : "Suspeita de população blastoide/imatura medular sustentada por arquitetura estruturada. Requer revisão hematológica especializada e correlação clínico-laboratorial.";

    out.finalClassification = cls;
    out.morphologicRiskClass = cls;
    out.riskLevel = observed
      ? "Achado medular crítico — população blastoide/imatura"
      : "Alta prioridade — suspeita de população blastoide/imatura";
    out.normalityBlocked = true;
    out.requiresHumanReview = true;
    out.findings.blastSuspicion = true;
    out.findings.immatureCells = true;
    out.mainFinding = finding;
    out.primaryFinding = finding;
    out.finalConclusion = finding;
    out.overallAssessment.requiresHumanReview = true;
    out.overallAssessment.riskCategory = cls;
    out.overallAssessment.mainImpression = finding;
    out.structuredReport.conclusion = finding;
    out.patternRecognition.overallPattern = cls;
    return out;
  }

  if (!authority.applyExpansionAuthority) {
    return out;
  }

  const mainFinding =
    result.mainFinding &&
    !/bl[aá]st|blastoide|alto risco/i.test(String(result.mainFinding))
      ? result.mainFinding
      : "Expansão mieloide/granulocítica com amplo espectro maturativo, sem subpopulação blastoide distinta, coerente e repetida sustentada no campo analisado.";

  out.finalClassification =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  out.morphologicRiskClass =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  out.riskLevel =
    "Expansão mieloide/granulocítica relevante com maturação preservada";
  out.normalityBlocked = true;
  out.requiresHumanReview = true;

  // Population-level blast flags are terminally reconciled. Focal cytology
  // remains available through LME/005.44 evidence containers.
  out.findings.blastSuspicion = false;
  out.findings.immatureCells = false;
  out.findings.focalImmatureCytologyObserved =
    result.findings?.focalImmatureCytologyObserved === true ||
    num(result.marrowPositiveBlastEvidenceSemanticSupersession?.approximateBlastLikeCells) > 0;
  out.findings.blastEvidenceState =
    "FOCAL_CYTOLOGY_CONTEXTUALIZED_WITHIN_MYELOID_MATURATION";

  out.mainFinding = mainFinding;
  out.primaryFinding = mainFinding;
  out.finalConclusion = mainFinding;

  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.riskCategory =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";
  out.overallAssessment.mainImpression = mainFinding;

  out.structuredReport.conclusion = mainFinding;
  out.patternRecognition.overallPattern =
    "MARROW_MYELOID_EXPANSION_WITH_MATURATION_PATTERN";

  out.globalPattern = {
    ...obj(result.globalPattern),
    dominantPattern:
      "MARROW_PATHOLOGIC_MYELOID_EXPANSION_WITH_MATURATION",
    marrowPositiveBlastEvidence: false,
    pathologicMyeloidExpansionPattern: true,
  };

  // Keep representativity explicit, but do not let it replace morphology.
  out.evidenceGovernance = {
    ...obj(result.evidenceGovernance),
    limitedField: authority.limitedField,
    evidenceScope: authority.limitedField
      ? "FIELD_SCOPED"
      : obj(result.evidenceGovernance).evidenceScope,
  };

  out.blockNormalReason = uniqueStrings([
    ...(Array.isArray(result.blockNormalReason) ? result.blockNormalReason : []),
    "Expansão mieloide/granulocítica com maturação requer correlação hematológica.",
    ...(authority.limitedField
      ? ["Representatividade limitada restringe quantificação/globalização, sem substituir a classificação morfológica dominante."]
      : []),
  ]);

  out.finalMarrowAuthority = {
    ...authority,
    applied: true,
    postLegacyReconciliationVersion:
      MARROW_POST_LEGACY_RECONCILIATION_VERSION,
    legacyBlastResurrectionBlocked: true,
    rawEvidencePreserved: true,
  };

  return out;
}

export default applyFinalMarrowAuthority;
