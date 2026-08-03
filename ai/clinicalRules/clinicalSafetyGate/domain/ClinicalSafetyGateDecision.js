export const CLINICAL_SAFETY_GATE_DECISION_SCHEMA_VERSION =
  "CRR-000034-v1";

export function createClinicalSafetyGateDecision({
  caseId,
  decision,
  releaseAllowed,
  automationAllowed,
  requiresHumanReview,
  safetyScore,
  reasons = [],
  blockingReasons = [],
  warningReasons = [],
  explanation = {},
  auditTrail = {},
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !decision || !createdAt) {
    throw new TypeError(
      "ClinicalSafetyGateDecision requires caseId, decision and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      CLINICAL_SAFETY_GATE_DECISION_SCHEMA_VERSION,
    caseId: String(caseId),
    decision: String(decision),
    releaseAllowed: Boolean(releaseAllowed),
    automationAllowed: Boolean(automationAllowed),
    requiresHumanReview: Boolean(requiresHumanReview),
    safetyScore: Number(safetyScore),
    reasons: Object.freeze([...reasons]),
    blockingReasons: Object.freeze([...blockingReasons]),
    warningReasons: Object.freeze([...warningReasons]),
    explanation: Object.freeze({ ...explanation }),
    auditTrail: Object.freeze({ ...auditTrail }),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "The clinical safety gate controls workflow release and does not establish a definitive diagnosis.",
  });
}
