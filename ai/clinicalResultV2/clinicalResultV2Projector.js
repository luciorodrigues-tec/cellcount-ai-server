// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRA-001.1 — Clinical Result V2 Projector
// ============================================================================

import { buildCanonicalClinicalTruth } from "./canonicalClinicalTruthBuilder.js";
import {
  assertCanonicalClinicalTruth,
  validateCanonicalClinicalTruth,
} from "./canonicalClinicalTruthValidator.js";
import { buildExpertHematologyNarrative } from "./expertHematologyNarrative.js";

export function projectClinicalResultV2(result = {}, context = {}) {
  const truth = buildCanonicalClinicalTruth(result, context);
  const validation = validateCanonicalClinicalTruth(truth);

  // Fail closed: never publish a contradictory V2 result.
  if (!validation.deliveryAllowed) {
    const error = new Error(
      "CRA-001.1 blocked contradictory canonical clinical truth.",
    );
    error.code = "CRA_CANONICAL_TRUTH_INVALID";
    error.validation = validation;
    throw error;
  }

  assertCanonicalClinicalTruth(truth);

  const narrative = buildExpertHematologyNarrative(truth, result);

  return {
    ...truth,
    narrative,
    validation: {
      valid: true,
      deliveryAllowed: true,
      errorCount: 0,
      warningCount: validation.warnings.length,
    },
  };
}

export function attachClinicalResultV2(result = {}, context = {}) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new TypeError("CRA-001.1 requires a result object.");
  }

  return {
    ...result,
    clinicalResultV2: projectClinicalResultV2(result, context),
  };
}
