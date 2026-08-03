export const CLINICAL_GUIDELINE_AUDIT_ADAPTER_VERSION =
  "CGL-000004-S3-v1.0.0";

export class ClinicalGuidelineAuditAdapter {
  toAuditPayload({
    guideline,
    executionResult,
  } = {}) {
    if (!guideline || !executionResult) {
      throw new TypeError(
        "ClinicalGuidelineAuditAdapter requires guideline and executionResult.",
      );
    }

    return Object.freeze({
      guidelineId:
        guideline.guidelineId.toString(),
      guidelineVersion:
        guideline.version.version,
      executionStatus:
        executionResult.status,
      visitedNodes:
        executionResult.visitedNodes,
      selectedBranchIds:
        Object.freeze(
          executionResult.selectedBranches.map(
            (branch) => branch.branchId,
          ),
        ),
      recommendationIds:
        Object.freeze(
          executionResult.recommendations.map(
            (recommendation) =>
              recommendation.recommendationId,
          ),
        ),
      outcomeId:
        executionResult.outcome?.outcomeId ??
        null,
      outcomeType:
        executionResult.outcome?.type ??
        null,
      requiresHumanReview:
        executionResult.requiresHumanReview,
    });
  }
}
