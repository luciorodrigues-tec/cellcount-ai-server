export const DIAGNOSTIC_UNCERTAINTY_RESULT_SCHEMA_VERSION =
  "CRR-000031-v1";

export function createDiagnosticUncertaintyResult({
  caseId,
  totalUncertaintyScore,
  uncertaintyLevel,
  epistemicUncertainty,
  observationalUncertainty,
  conflictUncertainty,
  competitionUncertainty,
  residualUncertainty,
  requiresHumanReview,
  automationAllowed,
  factors = [],
  unresolvedQuestions = [],
  recommendations = [],
  explanation = {},
  auditTrail = {},
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !createdAt) {
    throw new TypeError(
      "DiagnosticUncertaintyResult requires caseId and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_UNCERTAINTY_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    totalUncertaintyScore:
      Number(totalUncertaintyScore),
    uncertaintyLevel:
      String(uncertaintyLevel),
    epistemicUncertainty:
      Number(epistemicUncertainty),
    observationalUncertainty:
      Number(observationalUncertainty),
    conflictUncertainty:
      Number(conflictUncertainty),
    competitionUncertainty:
      Number(competitionUncertainty),
    residualUncertainty:
      Number(residualUncertainty),
    requiresHumanReview:
      Boolean(requiresHumanReview),
    automationAllowed:
      Boolean(automationAllowed),
    factors: Object.freeze([...factors]),
    unresolvedQuestions:
      Object.freeze([...unresolvedQuestions]),
    recommendations:
      Object.freeze([...recommendations]),
    explanation: Object.freeze({
      ...explanation,
    }),
    auditTrail: Object.freeze({
      ...auditTrail,
    }),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "Diagnostic uncertainty is clinical decision support and does not establish a definitive diagnosis.",
  });
}
