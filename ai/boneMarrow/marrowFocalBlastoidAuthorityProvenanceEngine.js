// ============================================================================
// CELLCOUNT ENTERPRISE
// BE-FIX-005.50.23 — MARROW FOCAL BLASTOID AUTHORITY PROVENANCE PRESERVATION
// & LEGACY POPULATION REPROMOTION ELIMINATION
//
// Purpose:
// Capture the trusted cell-level focal blastoid authority immediately after
// 005.50.18 and preserve it across legacy normalization/reconstruction.
// Once locked, derived population writers cannot turn focal cytology into a
// population claim. Independent OBSERVED_POPULATION / SUSPICIOUS_POPULATION
// evidence remains protected and can supersede the focal provenance.
// ============================================================================

export const MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION =
  "BE-FIX-005.50.23";
export const MARROW_FOCAL_BLASTOID_PROVENANCE_MONOTONIC_LOCK_VERSION =
  "BE-FIX-005.50.23";
export const MARROW_LEGACY_POPULATION_REPROMOTION_ELIMINATION_VERSION =
  "BE-FIX-005.50.23";
export const MARROW_FOCAL_BLASTOID_PROVENANCE_RECOVERY_VERSION =
  "BE-FIX-005.50.23";

function obj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function upper(v) {
  return String(v || "").trim().toUpperCase();
}

function firstObject(...values) {
  for (const value of values) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value;
    }
  }
  return {};
}

function readExistingProvenance(result = {}) {
  return firstObject(
    result.marrowFocalBlastoidAuthorityProvenance,
    result.rawResponse?.marrowFocalBlastoidAuthorityProvenance,
  );
}

function readRecovery(result = {}) {
  return firstObject(
    result.marrowTrueAmlPositiveCytomorphologyRecovery,
    result.rawResponse?.marrowTrueAmlPositiveCytomorphologyRecovery,
  );
}

function readRawOriginState(result = {}) {
  const candidates = [
    result.rawResponse?.blastAssessment?.evidenceState,
    result.blastAssessment?.evidenceState,
    result.localMorphologyEvidence?.marrow?.blastPopulationEvidence?.evidenceState,
    result.visualMorphologyEvidenceAcquisition?.acquiredDomains
      ?.blastPopulationEvidenceState,
    result.rawResponse?.visualMorphologyEvidenceAcquisition?.acquiredDomains
      ?.blastPopulationEvidenceState,
  ].map(upper).filter(Boolean);

  return candidates.find((state) => [
    "OBSERVED_POPULATION",
    "SUSPICIOUS_POPULATION",
    "FOCAL_SUSPICION",
  ].includes(state)) || candidates[0] || "";
}

function independentPopulationState(result = {}) {
  const existing = readExistingProvenance(result);
  if (
    existing.independentPopulationEvidenceState === "OBSERVED_POPULATION" ||
    existing.independentPopulationEvidenceState === "SUSPICIOUS_POPULATION"
  ) {
    return existing.independentPopulationEvidenceState;
  }

  const origin = readRawOriginState(result);
  if (origin === "OBSERVED_POPULATION" || origin === "SUSPICIOUS_POPULATION") {
    return origin;
  }

  // Never use late projected booleans as independent population provenance.
  return null;
}

export function evaluateMarrowFocalBlastoidAuthorityProvenance(result = {}) {
  const existing = readExistingProvenance(result);
  const recovery = readRecovery(result);
  const independentState = independentPopulationState(result);

  if (independentState) {
    return {
      version: MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION,
      monotonicLockVersion:
        MARROW_FOCAL_BLASTOID_PROVENANCE_MONOTONIC_LOCK_VERSION,
      legacyRepromotionEliminationVersion:
        MARROW_LEGACY_POPULATION_REPROMOTION_ELIMINATION_VERSION,
      recoveryVersion: MARROW_FOCAL_BLASTOID_PROVENANCE_RECOVERY_VERSION,
      locked: false,
      focalCellLevelPositive: false,
      originEvidenceState: independentState,
      effectiveEvidenceState: independentState,
      independentPopulationEvidenceState: independentState,
      populationInferenceAllowed: true,
      populationPositiveAllowed: true,
      blastPercentageInferenceAllowed: true,
      focalBlastoidFindingDoesNotEstablishPopulation: false,
      source: "INDEPENDENT_QUALIFIED_POPULATION_EVIDENCE",
      reason:
        "Independent population-level evidence is provenance-qualified and remains outside the focal anti-repromotion path.",
    };
  }

  // A previously locked provenance is monotonic. Late writers may reconstruct
  // clinical containers, but they cannot erase the original focal authority.
  if (existing.locked === true && existing.focalCellLevelPositive === true) {
    return {
      ...existing,
      version: MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION,
      monotonicLockVersion:
        MARROW_FOCAL_BLASTOID_PROVENANCE_MONOTONIC_LOCK_VERSION,
      legacyRepromotionEliminationVersion:
        MARROW_LEGACY_POPULATION_REPROMOTION_ELIMINATION_VERSION,
      recoveryVersion: MARROW_FOCAL_BLASTOID_PROVENANCE_RECOVERY_VERSION,
      locked: true,
      focalCellLevelPositive: true,
      originEvidenceState: "FOCAL_SUSPICION",
      effectiveEvidenceState: "FOCAL_SUSPICION",
      independentPopulationEvidenceState: null,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      focalBlastoidFindingDoesNotEstablishPopulation: true,
      source: existing.source || "MONOTONIC_005_50_23_PROVENANCE",
      reason:
        "Previously captured focal cell-level blastoid provenance remains monotonic across legacy result reconstruction.",
    };
  }

  const trustedRecovery =
    recovery.active === true &&
    recovery.cellLevelPositiveCytology === true &&
    recovery.directCellLevelPositive === true &&
    upper(recovery.recoveredEvidenceState) === "FOCAL_SUSPICION" &&
    recovery.preExistingArchitectureQualified !== true &&
    recovery.populationPositiveFabricated === false &&
    recovery.populationPromotionAllowedByThisEngine === false;

  if (trustedRecovery) {
    return {
      version: MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION,
      monotonicLockVersion:
        MARROW_FOCAL_BLASTOID_PROVENANCE_MONOTONIC_LOCK_VERSION,
      legacyRepromotionEliminationVersion:
        MARROW_LEGACY_POPULATION_REPROMOTION_ELIMINATION_VERSION,
      recoveryVersion: MARROW_FOCAL_BLASTOID_PROVENANCE_RECOVERY_VERSION,
      locked: true,
      focalCellLevelPositive: true,
      originEvidenceState: "FOCAL_SUSPICION",
      effectiveEvidenceState: "FOCAL_SUSPICION",
      independentlyBlastoidCellCount:
        Number.isFinite(Number(recovery.independentlyBlastoidCellCount))
          ? Number(recovery.independentlyBlastoidCellCount)
          : null,
      independentPopulationEvidenceState: null,
      populationInferenceAllowed: false,
      populationPositiveAllowed: false,
      blastPercentageInferenceAllowed: false,
      focalBlastoidFindingDoesNotEstablishPopulation: true,
      source: "BE-FIX-005.50.18_TRUSTED_CELL_LEVEL_CYTOLOGY",
      sourceRecoveryVersion: recovery.version || "BE-FIX-005.50.18",
      reason:
        "Trusted positive blastoid cytomorphology was acquired at cell/field scope without independent population architecture; focal scope is now provenance-locked.",
    };
  }

  return {
    version: MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION,
    monotonicLockVersion:
      MARROW_FOCAL_BLASTOID_PROVENANCE_MONOTONIC_LOCK_VERSION,
    legacyRepromotionEliminationVersion:
      MARROW_LEGACY_POPULATION_REPROMOTION_ELIMINATION_VERSION,
    recoveryVersion: MARROW_FOCAL_BLASTOID_PROVENANCE_RECOVERY_VERSION,
    locked: false,
    focalCellLevelPositive: false,
    originEvidenceState: readRawOriginState(result) || null,
    effectiveEvidenceState: readRawOriginState(result) || null,
    independentPopulationEvidenceState: null,
    populationInferenceAllowed: null,
    populationPositiveAllowed: null,
    blastPercentageInferenceAllowed: null,
    focalBlastoidFindingDoesNotEstablishPopulation: false,
    source: null,
    reason: "No provenance-qualified focal cell-level blastoid authority captured.",
  };
}

export function applyMarrowFocalBlastoidAuthorityProvenance(result = {}) {
  if (!result || typeof result !== "object") return result;

  const provenance = evaluateMarrowFocalBlastoidAuthorityProvenance(result);
  const out = {
    ...result,
    findings: { ...obj(result.findings) },
    evidenceGovernance: { ...obj(result.evidenceGovernance) },
    marrowFocalBlastoidAuthorityProvenance: provenance,
  };

  if (!provenance.locked) return out;

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
  out.evidenceGovernance.focalBlastoidAuthorityProvenanceVersion =
    MARROW_FOCAL_BLASTOID_AUTHORITY_PROVENANCE_VERSION;

  return out;
}

export default applyMarrowFocalBlastoidAuthorityProvenance;
