import {
  createGuidelineExecutionResult,
} from "./GuidelineExecutionResult.js";

export const GUIDELINE_EXECUTION_SERVICE_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineExecutionService {
  constructor({
    navigator,
    branchResolver,
    recommendationResolver,
    outcomeResolver,
    clock = () => new Date(),
  } = {}) {
    this.navigator = navigator;
    this.branchResolver =
      branchResolver;
    this.recommendationResolver =
      recommendationResolver;
    this.outcomeResolver =
      outcomeResolver;
    this.clock = clock;
  }

  execute(guideline, context = {}) {
    const startedAt =
      this.clock();

    const visitedNodes = [];
    const matchedConditions = [];
    const selectedBranches = [];
    const recommendations = [];
    const executionTrace = [];

    let requiresHumanReview = false;
    let currentNodeId =
      guideline.entryNodeId;
    let outcome = null;
    let status = "COMPLETED";

    while (currentNodeId) {
      this.navigator.assertTransition({
        visitedNodeIds: visitedNodes,
        nextNodeId: currentNodeId,
      });

      const node =
        this.navigator.getNode(
          guideline,
          currentNodeId,
        );

      if (!node) {
        status = "FAILED";
        executionTrace.push(
          Object.freeze({
            type: "ERROR",
            message:
              `Node not found: ${currentNodeId}`,
          }),
        );
        break;
      }

      visitedNodes.push(node.nodeId);

      executionTrace.push(
        Object.freeze({
          type: "NODE_VISITED",
          nodeId: node.nodeId,
          nodeType: node.type,
        }),
      );

      const resolvedRecommendations =
        this.recommendationResolver.resolve(
          node,
          guideline,
        );

      recommendations.push(
        ...resolvedRecommendations.recommendations,
      );

      requiresHumanReview =
        requiresHumanReview ||
        resolvedRecommendations.requiresHumanReview;

      outcome =
        this.outcomeResolver.resolve(
          node,
          guideline,
        );

      if (outcome) {
        executionTrace.push(
          Object.freeze({
            type: "OUTCOME_RESOLVED",
            outcomeId:
              outcome.outcomeId,
            outcomeType:
              outcome.type,
          }),
        );
        break;
      }

      const branchResult =
        this.branchResolver.resolve({
          node,
          guideline,
          context,
        });

      matchedConditions.push(
        ...branchResult.evaluations.filter(
          (evaluation) =>
            evaluation.matched,
        ),
      );

      if (!branchResult.selectedBranch) {
        status = "HELD";
        executionTrace.push(
          Object.freeze({
            type: "NO_BRANCH_MATCHED",
            nodeId: node.nodeId,
          }),
        );
        break;
      }

      selectedBranches.push(
        branchResult.selectedBranch,
      );

      executionTrace.push(
        Object.freeze({
          type: "BRANCH_SELECTED",
          branchId:
            branchResult.selectedBranch.branchId,
          targetNodeId:
            branchResult.selectedBranch.targetNodeId,
        }),
      );

      currentNodeId =
        branchResult.selectedBranch.targetNodeId;
    }

    const completedAt =
      this.clock();

    return createGuidelineExecutionResult({
      guidelineId:
        guideline.guidelineId.toString(),
      version:
        guideline.version.version,
      status,
      visitedNodes,
      matchedConditions,
      selectedBranches,
      recommendations,
      references:
        guideline.references,
      outcome,
      requiresHumanReview,
      executionTrace,
      executionTimeMs:
        Math.max(
          0,
          completedAt.getTime() -
          startedAt.getTime(),
        ),
      createdAt:
        completedAt.toISOString(),
    });
  }
}
