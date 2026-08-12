// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRA-001.1 — Canonical Clinical Truth Validator
// Fails closed on contradictory final states.
// ============================================================================

import {
  CLINICAL_RESULT_V2_CONTRACT,
  ClinicalEvidenceState,
  isClinicalEvidenceState,
} from "./clinicalEvidenceState.js";

function issue(code, message, path) {
  return { code, message, path };
}

export function validateCanonicalClinicalTruth(truth = {}) {
  const errors = [];
  const warnings = [];

  if (!truth || typeof truth !== "object" || Array.isArray(truth)) {
    return {
      valid: false,
      deliveryAllowed: false,
      errors: [issue("CCT_INVALID_ROOT", "Canonical truth must be an object.", "$")],
      warnings,
    };
  }

  if (truth.contract !== CLINICAL_RESULT_V2_CONTRACT) {
    errors.push(issue(
      "CCT_CONTRACT_MISMATCH",
      `Expected ${CLINICAL_RESULT_V2_CONTRACT}.`,
      "contract",
    ));
  }

  const critical = truth.criticalFindings || {};
  for (const [name, item] of Object.entries(critical)) {
    if (!item || !isClinicalEvidenceState(item.state)) {
      errors.push(issue(
        "CCT_INVALID_EVIDENCE_STATE",
        `Invalid or missing evidence state for ${name}.`,
        `criticalFindings.${name}.state`,
      ));
    }
  }

  const parasiteState = truth.parasiteArtifact?.parasite?.state;
  if (
    truth.parasiteArtifact?.parasiteSuspicionAllowed === true &&
    parasiteState !== ClinicalEvidenceState.OBSERVED
  ) {
    errors.push(issue(
      "CCT_PARASITE_PROMOTION_WITHOUT_EVIDENCE",
      "Parasite suspicion cannot be allowed without OBSERVED structured parasite evidence.",
      "parasiteArtifact.parasiteSuspicionAllowed",
    ));
  }

  if (
    truth.parasiteArtifact?.artifactLikelihood === "FAVORED" &&
    parasiteState !== ClinicalEvidenceState.OBSERVED &&
    truth.parasiteArtifact?.organismCandidate
  ) {
    errors.push(issue(
      "CCT_ARTIFACT_ORGANISM_CONTRADICTION",
      "Artifact-favored, non-observed parasite evidence cannot carry an organism candidate.",
      "parasiteArtifact.organismCandidate",
    ));
  }

  if (
    truth.patternInterpretation?.mononucleosisPattern?.supported === true &&
    truth.patternInterpretation?.reactiveLymphoid?.supported !== true
  ) {
    errors.push(issue(
      "CCT_MONONUCLEOSIS_WITHOUT_REACTIVE_PATTERN",
      "Mononucleosis pattern requires a supported reactive lymphoid pattern.",
      "patternInterpretation.mononucleosisPattern.supported",
    ));
  }

  if (
    truth.criticalFindings?.blastLike?.state === ClinicalEvidenceState.OBSERVED &&
    truth.review?.required !== true
  ) {
    errors.push(issue(
      "CCT_BLAST_WITHOUT_REVIEW",
      "Observed blast/blast-like evidence must require review.",
      "review.required",
    ));
  }

  if (
    truth.criticalFindings?.blastLike?.state === ClinicalEvidenceState.OBSERVED &&
    !["URGENT", "PRIORITY"].includes(truth.review?.urgency)
  ) {
    errors.push(issue(
      "CCT_BLAST_REVIEW_URGENCY",
      "Observed blast/blast-like evidence must be urgent or priority review.",
      "review.urgency",
    ));
  }

  if (
    truth.scope?.limitedField === true &&
    truth.scope?.globalNegativeExclusionAllowed === true
  ) {
    errors.push(issue(
      "CCT_LIMITED_FIELD_GLOBAL_NEGATIVE",
      "Limited field cannot authorize global negative exclusion.",
      "scope.globalNegativeExclusionAllowed",
    ));
  }

  if (
    truth.quality?.visualAcquisitionComplete === false &&
    truth.review?.required !== true
  ) {
    errors.push(issue(
      "CCT_INCOMPLETE_VISUAL_WITHOUT_REVIEW",
      "Incomplete visual acquisition must require human review.",
      "review.required",
    ));
  }

  return {
    valid: errors.length === 0,
    deliveryAllowed: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertCanonicalClinicalTruth(truth = {}) {
  const validation = validateCanonicalClinicalTruth(truth);

  if (!validation.valid) {
    const error = new Error(
      `CRA-001.1 canonical truth validation failed: ${validation.errors
        .map((item) => `${item.code}:${item.path}`)
        .join(", ")}`,
    );
    error.code = "CRA_CANONICAL_TRUTH_INVALID";
    error.validation = validation;
    throw error;
  }

  return validation;
}
