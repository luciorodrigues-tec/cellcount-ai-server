export const EXPLAINABLE_DECISION_TREE_POLICY_VERSION =
  "CRR-000032-v1.0.0";

export const DEFAULT_EXPLAINABLE_DECISION_TREE_POLICY =
  Object.freeze({
    version: EXPLAINABLE_DECISION_TREE_POLICY_VERSION,
    includeRejectedHypotheses: true,
    includeEvidence: true,
    includeRecommendations: true,
    includeUncertaintyFactors: true,
    maximumNodes: 250,
    maximumEdges: 500,
    requireHumanReviewOnCycle: true,
    requireHumanReviewOnDisconnectedOutcome: true,
  });

export function mergeExplainableDecisionTreePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_EXPLAINABLE_DECISION_TREE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
