// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.21 — MARROW FOCAL BLASTOID SCOPE TERMINAL AUTHORITY
// & LEGACY NON-REPROMOTION LOCK
//
// Purpose:
// Convert the already-established 005.50.19 focal cell-level blastoid scope
// into a monotonic terminal authority consumed by late marrow writers.
// A false population permission cannot become true again without independent,
// provenance-qualified population evidence.
// ============================================================================

export const MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION =
  "BE-FIX-005.50.21";
export const MARROW_FOCAL_BLASTOID_LEGACY_NON_REPROMOTION_VERSION =
  "BE-FIX-005.50.21";
export const MARROW_FOCAL_BLASTOID_MONOTONIC_SCOPE_VERSION =
  "BE-FIX-005.50.21";
export const MARROW_FOCAL_BLASTOID_TERMINAL_PRESENTATION_POLICY_VERSION =
  "BE-FIX-005.50.21";

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function upper(v) {
  return String(v || "").trim().toUpperCase();
}

function originEvidenceState(result = {}) {
  const states = [
    result?.marrowPositiveCellLevelBlastoidScopeLock?.originEvidenceState,
    result?.marrowTrueAmlPositiveCytomorphologyRecovery?.priorEvidenceState,
    result?.rawResponse?.blastAssessment?.evidenceState,
    result?.blastAssessment?.evidenceState,
    result?.visualMorphologyEvidenceAcquisition?.acquiredDomains
      ?.blastPopulationEvidenceState,
  ].map(upper).filter(Boolean);
  return states.find((s) => [
    "OBSERVED_POPULATION",
    "SUSPICIOUS_POPULATION",
    "FOCAL_SUSPICION",
  ].includes(s)) || states[0] || "";
}

function cellLevelPositive(result = {}) {
  return (
    result?.marrowPositiveCellLevelBlastoidScopeLock
      ?.cellLevelPositiveBlastoidCytology === true ||
    result?.marrowTrueAmlPositiveCytomorphologyRecovery
      ?.cellLevelPositiveCytology === true ||
    result?.evidenceGovernance?.cellLevelPositiveBlastoidCytology === true ||
    result?.findings?.cellLevelPositiveBlastoidCytology === true
  );
}

function populationInferenceForbidden(result = {}) {
  return (
    result?.marrowPositiveCellLevelBlastoidScopeLock
      ?.populationInferenceForbidden === true ||
    result?.fieldAdequacy?.populationInferenceAllowed === false ||
    result?.fieldAdequacy?.adequateForPopulationAssessment === false ||
    result?.evidenceGovernance?.populationInferenceAllowed === false ||
    result?.marrowMyeloidExpansionDiscrimination
      ?.populationInferenceAllowed === false ||
    result?.marrowPositiveBlastEvidenceSemanticSupersession
      ?.populationInferenceAllowed === false
  );
}

function independentlyObservedPopulation(result = {}) {
  const origin = originEvidenceState(result);
  return (
    origin === "OBSERVED_POPULATION" ||
    (
      result?.marrowBlastPopulationEvidence?.observedPopulation === true &&
      upper(result?.marrowBlastPopulationEvidence?.evidenceState) ===
        "OBSERVED_POPULATION"
    ) ||
    result?.finalMarrowAuthority?.structuredBlast?.observed === true
  );
}

function independentlySuspiciousPopulation(result = {}) {
  // Deliberately require SUSPICIOUS_POPULATION at the evidence origin. Derived
  // repeated/coherent flags from a FOCAL_SUSPICION are not sufficient.
  return originEvidenceState(result) === "SUSPICIOUS_POPULATION";
}

export function evaluateMarrowFocalBlastoidTerminalAuthority(result = {}) {
  const origin = originEvidenceState(result);
  const focalOrigin = origin === "FOCAL_SUSPICION";
  const positive = cellLevelPositive(result);
  const inferenceForbidden = populationInferenceForbidden(result);
  const observedProtected = independentlyObservedPopulation(result);
  const suspiciousProtected = independentlySuspiciousPopulation(result);

  const active =
    focalOrigin &&
    positive &&
    inferenceForbidden &&
    !observedProtected &&
    !suspiciousProtected;

  return {
    version: MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
    legacyNonRepromotionVersion:
      MARROW_FOCAL_BLASTOID_LEGACY_NON_REPROMOTION_VERSION,
    monotonicScopeVersion: MARROW_FOCAL_BLASTOID_MONOTONIC_SCOPE_VERSION,
    terminalPresentationPolicyVersion:
      MARROW_FOCAL_BLASTOID_TERMINAL_PRESENTATION_POLICY_VERSION,
    active,
    originEvidenceState: origin || null,
    cellLevelPositiveBlastoidCytology: positive,
    populationInferenceForbidden: inferenceForbidden,
    trueObservedPopulationProtected: observedProtected,
    preExistingSuspiciousPopulationProtected: suspiciousProtected,
    effectiveEvidenceState: active ? "FOCAL_SUSPICION" : (origin || null),
    populationInferenceAllowed: active ? false : null,
    populationPositiveAllowed: active ? false : null,
    blastPercentageInferenceAllowed: active ? false : null,
    focalBlastoidFindingDoesNotEstablishPopulation: active,
    diagnosisAllowedByThisEngine: false,
    reason: active
      ? "Positive blastoid cytomorphology is terminally preserved at cell/field scope; no late writer may re-promote it to population or percentage authority without independent population evidence."
      : observedProtected
        ? "Independent OBSERVED_POPULATION is protected from focal-scope downgrade."
        : suspiciousProtected
          ? "Independent SUSPICIOUS_POPULATION is protected from focal-scope downgrade."
          : "No terminal focal blastoid scope authority required.",
  };
}

export function applyMarrowFocalBlastoidTerminalAuthority(result = {}) {
  if (!result || typeof result !== "object") return result;
  const d = evaluateMarrowFocalBlastoidTerminalAuthority(result);
  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    evidenceGovernance: { ...obj(result.evidenceGovernance) },
    globalPattern: { ...obj(result.globalPattern) },
    patternRecognition: { ...obj(result.patternRecognition) },
    overallAssessment: { ...obj(result.overallAssessment) },
    structuredReport: { ...obj(result.structuredReport) },
    marrowFocalBlastoidTerminalAuthority: d,
  };
  if (!d.active) return out;

  const focalClass = "MARROW_BLASTOID_FOCAL_SUSPICION";
  const focalPattern = "MARROW_FOCAL_POSITIVE_BLASTOID_CYTOLOGY_PATTERN";
  const title =
    "Citomorfologia blastoide focal positiva — escopo populacional não estabelecido";
  const meaning =
    "Foram identificadas células com citomorfologia blastoide sustentada no campo analisado. A representatividade limitada não permite transformar esse achado focal em frequência populacional nem estimar percentual de blastos.";

  out.normalityBlocked = true;
  out.requiresHumanReview = true;
  out.findings.immatureCells = true;
  out.findings.blastSuspicion = true;
  out.findings.blastEvidenceState = "FOCAL_SUSPICION";
  out.findings.cellLevelPositiveBlastoidCytology = true;

  out.evidenceGovernance.populationInferenceAllowed = false;
  out.evidenceGovernance.populationPositiveAllowed = false;
  out.evidenceGovernance.blastPercentageInferenceAllowed = false;
  out.evidenceGovernance.globalNegativeExclusionAllowed = false;
  out.evidenceGovernance.cellLevelPositiveBlastoidCytology = true;
  out.evidenceGovernance.evidenceScope = "FIELD_SCOPED";
  out.evidenceGovernance.focalBlastoidTerminalAuthorityVersion =
    MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION;

  out.finalClassification = focalClass;
  out.morphologicRiskClass = focalClass;
  out.riskLevel = "Alta prioridade — citomorfologia blastoide focal positiva";
  out.mainFinding = title;
  out.primaryFinding = title;
  out.finalConclusion = title;

  out.globalPattern = {
    ...obj(out.globalPattern),
    dominantPattern: focalPattern,
    physiologicAppearance: false,
    normalityBlocked: true,
    marrowPositiveBlastEvidence: false,
    marrowPositiveBlastoidCytology: true,
    marrowPopulationBlastEvidence: false,
    populationInferenceAllowed: false,
    populationPositiveAllowed: false,
    blastPercentageInferenceAllowed: false,
    focalBlastoidFindingDoesNotEstablishPopulation: true,
    blastAssessmentIndeterminate: false,
    blastAssessmentState:
      "FOCAL_POSITIVE_CYTOLOGY_POPULATION_NOT_ESTABLISHED",
    globalSummary: meaning,
    focalBlastoidTerminalAuthorityVersion:
      MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
  };

  out.patternRecognition.overallPattern = focalPattern;
  out.overallAssessment.requiresHumanReview = true;
  out.overallAssessment.riskCategory = focalClass;
  out.overallAssessment.mainImpression = title;
  out.structuredReport.conclusion = title;
  out.structuredReport.hematologicMeaning = meaning;

  if (out.marrowPositiveBlastEvidenceSemanticSupersession) {
    out.marrowPositiveBlastEvidenceSemanticSupersession = {
      ...obj(out.marrowPositiveBlastEvidenceSemanticSupersession),
      focalOnly: true,
      focalCytologyPreserved: true,
      truePositiveCytologyProtected: true,
      populationInferenceAllowed: false,
      focalPopulationScopeBlocked: true,
      populationPositiveAllowed: false,
      supersessionMode: "FOCAL_TERMINAL_SCOPE_AUTHORITY",
      scopeRestrictedByVersion:
        MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
    };
  }

  if (out.finalMarrowAuthority) {
    out.finalMarrowAuthority = {
      ...obj(out.finalMarrowAuthority),
      active: true,
      morphologyClassification: focalClass,
      structuredBlast: {
        ...obj(out.finalMarrowAuthority?.structuredBlast),
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
      focalBlastoidTerminalAuthorityVersion:
        MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
    };
  }

  if (out.marrowAdequacyMorphologyAxis) {
    out.marrowAdequacyMorphologyAxis = {
      ...obj(out.marrowAdequacyMorphologyAxis),
      morphologyClassification: focalClass,
      adequacyClassification: "CLASS_1_LIMITED_FIELD",
      limitedField: true,
      morphologyOverridesAdequacy: true,
    };
  }

  if (out.marrowTerminalMorphologyAdequacyProjectionLock) {
    out.marrowTerminalMorphologyAdequacyProjectionLock = {
      ...obj(out.marrowTerminalMorphologyAdequacyProjectionLock),
      active: true,
      positiveMarrowMorphology: true,
      trueBlastoid: false,
      morphologyClassification: focalClass,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      focalCytologyPopulationScopeLocked: true,
      blastSuspicion: true,
      focalBlastoidTerminalAuthorityVersion:
        MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
    };
  }

  if (out.clinicalPresentation) {
    out.clinicalPresentation = {
      ...obj(out.clinicalPresentation),
      interpretation: meaning,
      presentationPolicy: {
        ...obj(out.clinicalPresentation?.presentationPolicy),
        focalBlastoidFindingDoesNotEstablishPopulation: true,
        blastPercentageInferenceAllowed: false,
        populationInferenceAllowed: false,
        populationPositiveAllowed: false,
        cellLevelPositiveBlastoidCytology: true,
        focalBlastoidTerminalAuthorityVersion:
          MARROW_FOCAL_BLASTOID_SCOPE_TERMINAL_AUTHORITY_VERSION,
      },
    };
  }

  return out;
}

export default applyMarrowFocalBlastoidTerminalAuthority;
