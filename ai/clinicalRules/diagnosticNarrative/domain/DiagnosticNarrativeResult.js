export const DIAGNOSTIC_NARRATIVE_RESULT_SCHEMA_VERSION =
  "CRR-000024-v1";

export function createDiagnosticNarrativeResult({
  caseId,
  title,
  executiveSummary,
  morphologicInterpretation,
  diagnosticReasoning,
  evidenceInterpretation,
  classificationInterpretation,
  conflictInterpretation,
  recommendationNarrative,
  limitations,
  conclusion,
  sections = [],
  requiresHumanReview = false,
  automationBlocked = false,
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !createdAt) {
    throw new TypeError(
      "DiagnosticNarrativeResult requires caseId and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_NARRATIVE_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    title: String(title || "Narrativa clínica explicável"),
    executiveSummary: String(executiveSummary || ""),
    morphologicInterpretation:
      String(morphologicInterpretation || ""),
    diagnosticReasoning:
      String(diagnosticReasoning || ""),
    evidenceInterpretation:
      String(evidenceInterpretation || ""),
    classificationInterpretation:
      String(classificationInterpretation || ""),
    conflictInterpretation:
      String(conflictInterpretation || ""),
    recommendationNarrative:
      String(recommendationNarrative || ""),
    limitations: Object.freeze([
      ...(Array.isArray(limitations) ? limitations : []),
    ]),
    conclusion: String(conclusion || ""),
    sections: Object.freeze([
      ...(Array.isArray(sections) ? sections : []),
    ]),
    requiresHumanReview: Boolean(requiresHumanReview),
    automationBlocked: Boolean(automationBlocked),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "This narrative is clinical decision support, does not establish a definitive diagnosis, and must be interpreted by qualified professionals.",
  });
}
