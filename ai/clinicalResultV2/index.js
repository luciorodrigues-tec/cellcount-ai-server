// CRA-001.1 — Canonical Clinical Result Architecture V2
export {
  CRA_001_1_VERSION,
  CLINICAL_RESULT_V2_CONTRACT,
  ClinicalEvidenceState,
  ClinicalSeverity,
  createEvidenceItem,
  isClinicalEvidenceState,
  normalizeConfidence,
} from "./clinicalEvidenceState.js";

export {
  buildCanonicalClinicalTruth,
} from "./canonicalClinicalTruthBuilder.js";

export {
  validateCanonicalClinicalTruth,
  assertCanonicalClinicalTruth,
} from "./canonicalClinicalTruthValidator.js";

export {
  buildExpertHematologyNarrative,
} from "./expertHematologyNarrative.js";

export {
  projectClinicalResultV2,
  attachClinicalResultV2,
} from "./clinicalResultV2Projector.js";

export {
  CLINICAL_RESULT_COHERENCE_ENGINE_VERSION,
  buildClinicalResultCoherenceProjection,
} from "./clinicalResultCoherenceEngine.js";
