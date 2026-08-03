export const GUIDELINE_VALIDATION_SERVICE_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineValidationService {
  validate(guideline) {
    const issues = [];

    const nodeIds =
      new Set(
        guideline.nodes.map(
          (node) => node.nodeId,
        ),
      );

    if (!nodeIds.has(guideline.entryNodeId)) {
      issues.push(
        "ENTRY_NODE_MISSING",
      );
    }

    for (const branch of guideline.branches) {
      if (!nodeIds.has(branch.targetNodeId)) {
        issues.push(
          `UNKNOWN_BRANCH_TARGET:${branch.branchId}`,
        );
      }
    }

    const conditionIds =
      new Set(
        guideline.conditions.map(
          (condition) =>
            condition.conditionId,
        ),
      );

    for (const branch of guideline.branches) {
      if (!conditionIds.has(branch.conditionId)) {
        issues.push(
          `UNKNOWN_BRANCH_CONDITION:${branch.branchId}`,
        );
      }
    }

    const recommendationIds =
      new Set(
        guideline.recommendations.map(
          (recommendation) =>
            recommendation.recommendationId,
        ),
      );

    for (const node of guideline.nodes) {
      for (const recommendationId of node.recommendationIds) {
        if (!recommendationIds.has(recommendationId)) {
          issues.push(
            `UNKNOWN_RECOMMENDATION:${recommendationId}`,
          );
        }
      }
    }

    const outcomeIds =
      new Set(
        guideline.outcomes.map(
          (outcome) => outcome.outcomeId,
        ),
      );

    for (const node of guideline.nodes) {
      if (
        node.outcomeId &&
        !outcomeIds.has(node.outcomeId)
      ) {
        issues.push(
          `UNKNOWN_OUTCOME:${node.outcomeId}`,
        );
      }
    }

    return Object.freeze({
      valid: issues.length === 0,
      issues:
        Object.freeze(issues),
    });
  }
}
