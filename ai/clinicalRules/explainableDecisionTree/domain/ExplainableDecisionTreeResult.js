export const EXPLAINABLE_DECISION_TREE_RESULT_SCHEMA_VERSION =
  "CRR-000032-v1";

export function createExplainableDecisionTreeResult({
  caseId,
  rootNodeId,
  outcomeNodeId = null,
  nodes = [],
  edges = [],
  selectedPath = [],
  alternativePaths = [],
  cycleDetected = false,
  disconnectedOutcome = false,
  requiresHumanReview = false,
  explanation = {},
  auditTrail = {},
  createdAt,
  metadata = {},
} = {}) {
  if (!caseId || !rootNodeId || !createdAt) {
    throw new TypeError(
      "ExplainableDecisionTreeResult requires caseId, rootNodeId and createdAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      EXPLAINABLE_DECISION_TREE_RESULT_SCHEMA_VERSION,
    caseId: String(caseId),
    rootNodeId: String(rootNodeId),
    outcomeNodeId:
      outcomeNodeId === null ? null : String(outcomeNodeId),
    nodes: Object.freeze([...nodes]),
    edges: Object.freeze([...edges]),
    selectedPath: Object.freeze([...selectedPath]),
    alternativePaths: Object.freeze([...alternativePaths]),
    cycleDetected: Boolean(cycleDetected),
    disconnectedOutcome: Boolean(disconnectedOutcome),
    requiresHumanReview: Boolean(requiresHumanReview),
    explanation: Object.freeze({ ...explanation }),
    auditTrail: Object.freeze({ ...auditTrail }),
    createdAt: String(createdAt),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
    safetyStatement:
      "The explainable decision tree is clinical decision support and does not establish a definitive diagnosis.",
  });
}
