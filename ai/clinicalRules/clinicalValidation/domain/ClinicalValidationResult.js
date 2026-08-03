export const CLINICAL_VALIDATION_RESULT_SCHEMA_VERSION =
  "CRR-000033-v1";

export function createClinicalValidationResult({
  caseId,
  status,
  validationScore,
  clinicallyCoherent,
  requiresHumanReview,
  automationAllowed,
  releaseAllowed,
  issues = [],
  warnings = [],
  errors = [],
  blockingIssues = [],
  validatedHypothesisId = null,
  explanation = {},
  auditTrail = {},
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !status || !createdAt) {
    throw new TypeError(
      "ClinicalValidationResult requires caseId, status and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_VALIDATION_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    status: String(status),
    validationScore: Number(validationScore),
    clinicallyCoherent: Boolean(clinicallyCoherent),
    requiresHumanReview: Boolean(requiresHumanReview),
    automationAllowed: Boolean(automationAllowed),
    releaseAllowed: Boolean(releaseAllowed),
    issues: Object.freeze([...issues]),
    warnings: Object.freeze([...warnings]),
    errors: Object.freeze([...errors]),
    blockingIssues: Object.freeze([...blockingIssues]),
    validatedHypothesisId:
      validatedHypothesisId === null
        ? null
        : String(validatedHypothesisId),
    explanation: Object.freeze({ ...explanation }),
    auditTrail: Object.freeze({ ...auditTrail }),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "Clinical validation is structured decision support and does not establish a definitive diagnosis.",
  });
}
