// ============================================================================
// CELLCOUNT HEMATOLOGY ENTERPRISE
// CRA-001.1 — CANONICAL CLINICAL TRUTH FOUNDATION
// Clinical Evidence State
// ============================================================================

export const CRA_001_1_VERSION = "CRA-001.1";
export const CLINICAL_RESULT_V2_CONTRACT = "CELLCOUNT-CLINICAL-RESULT-2.0";

export const ClinicalEvidenceState = Object.freeze({
  OBSERVED: "OBSERVED",
  NOT_OBSERVED_IN_EVALUABLE_FIELD: "NOT_OBSERVED_IN_EVALUABLE_FIELD",
  NOT_ASSESSABLE: "NOT_ASSESSABLE",
});

export const ClinicalSeverity = Object.freeze({
  NONE: "NONE",
  INFORMATIONAL: "INFORMATIONAL",
  REVIEW: "REVIEW",
  INTERMEDIATE: "INTERMEDIATE",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
  INDETERMINATE: "INDETERMINATE",
});

export function isClinicalEvidenceState(value) {
  return Object.values(ClinicalEvidenceState).includes(value);
}

export function normalizeConfidence(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed > 1) return Math.max(0, Math.min(1, parsed / 100));
  return Math.max(0, Math.min(1, parsed));
}

export function createEvidenceItem({
  state = ClinicalEvidenceState.NOT_ASSESSABLE,
  confidence = 0,
  evidence = [],
  scope = "FIELD_LOCAL",
  requiresReview = false,
  severity = ClinicalSeverity.NONE,
  observedCount = null,
  notes = [],
} = {}) {
  if (!isClinicalEvidenceState(state)) {
    throw new TypeError(`Invalid clinical evidence state: ${state}`);
  }

  return {
    state,
    confidence: normalizeConfidence(confidence),
    evidence: Array.isArray(evidence) ? evidence.filter(Boolean) : [],
    scope,
    requiresReview: requiresReview === true,
    severity,
    observedCount:
      observedCount === null || observedCount === undefined
        ? null
        : Number.isFinite(Number(observedCount))
          ? Number(observedCount)
          : null,
    notes: Array.isArray(notes) ? notes.filter(Boolean) : [],
  };
}
