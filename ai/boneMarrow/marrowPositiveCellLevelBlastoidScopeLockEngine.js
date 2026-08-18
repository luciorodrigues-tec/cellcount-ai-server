// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.19 — MARROW POSITIVE CELL-LEVEL BLASTOID CYTOLOGY
// SCOPE PRESERVATION & POPULATION ANTI-PROMOTION LOCK
//
// Purpose:
// Preserve independently positive blastoid cytomorphology at CELL/FIELD scope
// while preventing a FOCAL_SUSPICION from being promoted into a population
// claim when representativity explicitly forbids population inference.
//
// Safety invariants:
// - positive cell-level blastoid cytology remains positive;
// - FOCAL_SUSPICION never becomes SUSPICIOUS/OBSERVED population solely by
//   downstream architecture writers when population inference is forbidden;
// - blast percentage inference stays disabled in the scoped state;
// - true pre-existing OBSERVED_POPULATION is never downgraded;
// - pre-existing qualified SUSPICIOUS_POPULATION is not rewritten here;
// - no diagnosis/lineage is created by this engine.
// ============================================================================

export const MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION =
  "BE-FIX-005.50.19";
export const MARROW_FOCAL_BLASTOID_POPULATION_ANTI_PROMOTION_VERSION =
  "BE-FIX-005.50.19";
export const MARROW_BLAST_PERCENTAGE_SCOPE_LOCK_VERSION =
  "BE-FIX-005.50.19";
export const MARROW_TERMINAL_FOCAL_BLASTOID_PRESENTATION_COHERENCE_VERSION =
  "BE-FIX-005.50.19";

function obj(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function upper(value) {
  return String(value || "").trim().toUpperCase();
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function readOriginState(result = {}) {
  const candidates = [
    result?.marrowTrueAmlPositiveCytomorphologyRecovery?.priorEvidenceState,
    result?.rawResponse?.blastAssessment?.evidenceState,
    result?.blastAssessment?.evidenceState,
    result?.visualMorphologyEvidenceAcquisition?.acquiredDomains?.blastPopulationEvidenceState,
    result?.marrowPositiveCytologyConsistency?.priorEvidenceState,
  ].map(upper).filter(Boolean);

  return candidates.find((state) => [
    "OBSERVED_POPULATION",
    "SUSPICIOUS_POPULATION",
    "FOCAL_SUSPICION",
  ].includes(state)) || candidates[0] || "";
}

function trueObservedPopulation(result = {}) {
  const origin = readOriginState(result);
  return (
    origin === "OBSERVED_POPULATION" ||
    result?.marrowBlastPopulationEvidence?.observedPopulation === true &&
      upper(result?.marrowBlastPopulationEvidence?.evidenceState) === "OBSERVED_POPULATION" ||
    result?.finalMarrowAuthority?.structuredBlast?.observed === true
  );
}

function preExistingSuspiciousPopulation(result = {}) {
  const origin = readOriginState(result);
  return origin === "SUSPICIOUS_POPULATION";
}

function positiveCellLevelBlastoidCytology(result = {}) {
  const recovery = obj(result.marrowTrueAmlPositiveCytomorphologyRecovery);
  const governance = obj(result.evidenceGovernance);
  const blast = obj(result.blastAssessment);
  const rawBlast = obj(result.rawResponse?.blastAssessment);

  return (
    recovery.cellLevelPositiveCytology === true ||
    governance.cellLevelPositiveBlastoidCytology === true ||
    blast.cellLevelPositiveBlastoidCytology === true ||
    rawBlast.cellLevelPositiveBlastoidCytology === true
  );
}

function populationInferenceForbidden(result = {}) {
  const field = obj(result.fieldAdequacy);
  const governance = obj(result.evidenceGovernance);
  const expansion = obj(result.marrowMyeloidExpansionDiscrimination);
  const supersession = obj(result.marrowPositiveBlastEvidenceSemanticSupersession);
  const representativity = obj(expansion.populationInferenceRepresentativity);

  return (
    field.populationInferenceAllowed === false ||
    field.adequateForPopulationAssessment === false ||
    governance.populationInferenceAllowed === false ||
    supersession.populationInferenceAllowed === false ||
    expansion.populationInferenceAllowed === false ||
    representativity.populationInferenceAllowed === false
  );
}

export function evaluateMarrowPositiveCellLevelBlastoidScopeLock(result = {}) {
  const originState = readOriginState(result);
  const cellLevelPositive = positiveCellLevelBlastoidCytology(result);
  const inferenceForbidden = populationInferenceForbidden(result);
  const observedPopulation = trueObservedPopulation(result);
  const suspiciousPopulationAtOrigin = preExistingSuspiciousPopulation(result);

  // This lock is intentionally narrow: it corrects a FOCAL origin that later
  // acquires population labels only because downstream writers interpreted
  // within-field repetition as population-level authority.
  const focalOrigin = originState === "FOCAL_SUSPICION";
  const active =
    cellLevelPositive &&
    focalOrigin &&
    inferenceForbidden &&
    !observedPopulation &&
    !suspiciousPopulationAtOrigin;

  return {
    version: MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    populationAntiPromotionVersion:
      MARROW_FOCAL_BLASTOID_POPULATION_ANTI_PROMOTION_VERSION,
    blastPercentageScopeLockVersion:
      MARROW_BLAST_PERCENTAGE_SCOPE_LOCK_VERSION,
    terminalPresentationCoherenceVersion:
      MARROW_TERMINAL_FOCAL_BLASTOID_PRESENTATION_COHERENCE_VERSION,
    active,
    originEvidenceState: originState || null,
    cellLevelPositiveBlastoidCytology: cellLevelPositive,
    populationInferenceForbidden: inferenceForbidden,
    trueObservedPopulationProtected: observedPopulation,
    preExistingSuspiciousPopulationProtected: suspiciousPopulationAtOrigin,
    effectiveEvidenceState: active ? "FOCAL_SUSPICION" : (originState || null),
    populationPositiveAllowed: active ? false : null,
    blastPercentageInferenceAllowed: active ? false : null,
    diagnosisAllowedByThisEngine: false,
    reason: active
      ? "Positive blastoid cytomorphology is preserved at cell/field scope, while limited representativity forbids promotion of a focal finding to population-level authority."
      : observedPopulation
        ? "Pre-existing OBSERVED_POPULATION is protected from focal-scope downgrade."
        : suspiciousPopulationAtOrigin
          ? "Pre-existing SUSPICIOUS_POPULATION is outside the focal anti-promotion correction path."
          : "No focal positive cell-level scope correction required.",
  };
}

export function applyMarrowPositiveCellLevelBlastoidScopeLock(result = {}) {
  if (!result || typeof result !== "object") return result;

  const decision = evaluateMarrowPositiveCellLevelBlastoidScopeLock(result);
  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    evidenceGovernance: { ...obj(result.evidenceGovernance) },
    overallAssessment: { ...obj(result.overallAssessment) },
    morphologyAnalysis: { ...obj(result.morphologyAnalysis) },
    structuredReport: { ...obj(result.structuredReport) },
    patternRecognition: { ...obj(result.patternRecognition) },
    globalPattern: { ...obj(result.globalPattern) },
    marrowPositiveCellLevelBlastoidScopeLock: decision,
  };

  if (!decision.active) return out;

  const focalClass = "MARROW_BLASTOID_FOCAL_SUSPICION";
  const focalTitle =
    "Citomorfologia blastoide focal positiva — escopo populacional não estabelecido";
  const focalMeaning =
    "Foram identificadas células com citomorfologia blastoide sustentada no campo analisado. A representatividade limitada não permite transformar esse achado focal em frequência populacional nem estimar percentual de blastos.";

  out.normalityBlocked = true;
  out.requiresHumanReview = true;
  out.findings.immatureCells = true;
  out.findings.blastSuspicion = true;
  out.findings.blastEvidenceState = "FOCAL_SUSPICION";
  out.findings.cellLevelPositiveBlastoidCytology = true;

  out.finalClassification = focalClass;
  out.morphologicRiskClass = focalClass;
  out.riskLevel = "Alta prioridade — citomorfologia blastoide focal positiva";

  out.evidenceGovernance.populationInferenceAllowed = false;
  out.evidenceGovernance.populationPositiveAllowed = false;
  out.evidenceGovernance.blastPercentageInferenceAllowed = false;
  out.evidenceGovernance.globalNegativeExclusionAllowed = false;
  out.evidenceGovernance.cellLevelPositiveBlastoidCytology = true;
  out.evidenceGovernance.evidenceScope = "FIELD_SCOPED";
  out.evidenceGovernance.focalBlastoidScopeLockVersion =
    MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION;

  // Downgrade only DERIVED population containers. The original focal positive
  // cytology remains fully preserved.
  if (result.marrowRecoveredCytologyProjection) {
    out.marrowRecoveredCytologyProjection = {
      ...obj(result.marrowRecoveredCytologyProjection),
      evidenceState: "FOCAL_SUSPICION",
      structuredPositive: false,
      populationPositiveAllowed: false,
      populationInferenceAllowed: false,
      blastPercentageInferenceAllowed: false,
      cellLevelPositiveCytology: true,
      scopeRestrictedByVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  if (result.marrowPositiveBlastEvidenceLock) {
    out.marrowPositiveBlastEvidenceLock = {
      ...obj(result.marrowPositiveBlastEvidenceLock),
      active: false,
      positiveEvidencePresent: true,
      positiveEvidencePreserved: true,
      populationPositiveAllowed: false,
      cellLevelPositiveCytology: true,
      evidenceScope: "FIELD_SCOPED",
      scopeRestrictedByVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  if (result.marrowBlastPopulationEvidence) {
    out.marrowBlastPopulationEvidence = {
      ...obj(result.marrowBlastPopulationEvidence),
      evidenceState: "FOCAL_SUSPICION",
      observedPopulation: false,
      suspiciousPopulation: false,
      focalSuspicion: true,
      positive: false,
      cellLevelPositiveCytology: true,
      populationPositiveAllowed: false,
      populationInferenceAllowed: false,
      scopeRestrictedByVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  if (result.marrowMaturationContinuumDiscrimination) {
    out.marrowMaturationContinuumDiscrimination = {
      ...obj(result.marrowMaturationContinuumDiscrimination),
      classification: "FOCAL_POSITIVE_BLASTOID_CYTOLOGY_WITH_LIMITED_POPULATION_SCOPE",
      observedStructuredPopulation: false,
      structuredPathologicSubset: false,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      cellLevelPositiveCytology: true,
      scopeRestrictedByVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  if (result.marrowPositiveBlastEvidenceSemanticSupersession) {
    out.marrowPositiveBlastEvidenceSemanticSupersession = {
      ...obj(result.marrowPositiveBlastEvidenceSemanticSupersession),
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      focalPopulationScopeBlocked: true,
      focalCytologyPreserved: true,
      truePositiveCytologyProtected: true,
      supersessionMode: "FOCAL_POSITIVE_CYTOLOGY_SCOPE_PRESERVED",
      scopeRestrictedByVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  out.globalPattern = {
    ...obj(result.globalPattern),
    dominantPattern: "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN",
    marrowPositiveBlastEvidence: false,
    marrowPositiveBlastoidCytology: true,
    marrowPopulationBlastEvidence: false,
    physiologicAppearance: false,
    normalityBlocked: true,
    blastAssessmentIndeterminate: false,
    blastAssessmentState: "FOCAL_POSITIVE_CYTOLOGY_POPULATION_NOT_ESTABLISHED",
    globalSummary: focalMeaning,
    focalBlastoidScopeLockVersion:
      MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
  };

  out.patternRecognition.overallPattern =
    "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN";
  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.riskCategory = focalClass;
  out.overallAssessment.mainImpression = focalTitle;
  out.morphologyAnalysis.summary = focalTitle;
  out.structuredReport.conclusion = focalTitle;
  out.structuredReport.hematologicMeaning = focalMeaning;
  out.mainFinding = focalTitle;
  out.primaryFinding = focalTitle;
  out.finalConclusion = focalTitle;

  out.blockNormalReason = unique([
    ...(Array.isArray(result.blockNormalReason) ? result.blockNormalReason : []),
    "Citomorfologia blastoide positiva observada em escopo focal.",
    "Representatividade limitada impede promoção do achado focal para população blastoide.",
    "Percentual de blastos não pode ser inferido a partir deste campo.",
  ]);

  // Reconcile terminal authority/projection metadata when they already exist.
  if (result.finalMarrowAuthority) {
    out.finalMarrowAuthority = {
      ...obj(result.finalMarrowAuthority),
      active: true,
      morphologyClassification: focalClass,
      limitedField: true,
      structuredBlast: {
        ...obj(result.finalMarrowAuthority?.structuredBlast),
        observed: false,
        suspicious: false,
        structured: false,
        evidenceState: "FOCAL_SUSPICION",
        focalOnly: true,
        focalPopulationScopeBlocked: true,
        populationInferenceAllowed: false,
        populationPositiveAllowed: false,
        cellLevelPositiveCytology: true,
      },
      focalBlastoidScopeLockVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  if (result.marrowAdequacyMorphologyAxis) {
    out.marrowAdequacyMorphologyAxis = {
      ...obj(result.marrowAdequacyMorphologyAxis),
      morphologyClassification: focalClass,
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      limitedField: true,
      morphologyOverridesAdequacy: true,
    };
  }

  if (result.marrowTerminalMorphologyAdequacyProjectionLock) {
    out.marrowTerminalMorphologyAdequacyProjectionLock = {
      ...obj(result.marrowTerminalMorphologyAdequacyProjectionLock),
      trueBlastoid: false,
      positiveMarrowMorphology: true,
      morphologyClassification: focalClass,
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      focalCytologyPopulationScopeLocked: true,
      blastSuspicion: true,
      focalBlastoidScopeLockVersion:
        MARROW_POSITIVE_CELL_LEVEL_BLASTOID_SCOPE_PRESERVATION_VERSION,
    };
  }

  // Canonical presentation is a late writer. If present, force its policy to
  // match the same scope without exposing internal implementation labels.
  if (result.clinicalPresentation) {
    const presentation = obj(result.clinicalPresentation);
    out.clinicalPresentation = {
      ...presentation,
      headline: {
        ...obj(presentation.headline),
        title: "Citomorfologia blastoide focal positiva",
        subtitle:
          "Achado focal prioritário; a representatividade não permite inferência populacional.",
        criticality: "HIGH",
        requiresHumanReview: true,
      },
      interpretation: focalMeaning,
      limitation:
        "Campo de representatividade limitada. O achado celular positivo permanece válido, porém não estabelece população blastoide nem percentual de blastos.",
      recommendation:
        "Revisão hematológica prioritária, avaliação de múltiplos campos e correlação com mielograma/hemograma; imunofenotipagem ou citometria de fluxo quando indicada.",
      presentationPolicy: {
        ...obj(presentation.presentationPolicy),
        focalBlastoidFindingDoesNotEstablishPopulation: true,
        blastPercentageInferenceAllowed: false,
        populationInferenceAllowed: false,
        populationPositiveAllowed: false,
        cellLevelPositiveBlastoidCytology: true,
      },
    };
  }

  return out;
}

export default applyMarrowPositiveCellLevelBlastoidScopeLock;
