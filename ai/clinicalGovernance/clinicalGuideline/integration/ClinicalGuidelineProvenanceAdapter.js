export const CLINICAL_GUIDELINE_PROVENANCE_ADAPTER_VERSION =
  "CGL-000004-S3-v1.0.0";

export class ClinicalGuidelineProvenanceAdapter {
  toProvenancePayload({
    guideline,
    executionResult,
  } = {}) {
    if (!guideline || !executionResult) {
      throw new TypeError(
        "ClinicalGuidelineProvenanceAdapter requires guideline and executionResult.",
      );
    }

    const guidelineNode = Object.freeze({
      nodeId:
        `GUIDELINE-${guideline.guidelineId.toString()}-${guideline.version.version}`,
      type: "RULE",
      label: guideline.name,
      metadata: Object.freeze({
        guidelineId:
          guideline.guidelineId.toString(),
        version:
          guideline.version.version,
        scope:
          guideline.scope.type,
      }),
    });

    const executionNodes =
      Object.freeze(
        executionResult.visitedNodes.map(
          (nodeId) =>
            Object.freeze({
              nodeId:
                `GUIDELINE-EXECUTION-${nodeId}`,
              type: "OBSERVATION",
              label: nodeId,
              metadata:
                Object.freeze({
                  visited: true,
                }),
            }),
        ),
      );

    const recommendationNodes =
      Object.freeze(
        executionResult.recommendations.map(
          (recommendation) =>
            Object.freeze({
              nodeId:
                `GUIDELINE-RECOMMENDATION-${recommendation.recommendationId}`,
              type: "REPORT",
              label:
                recommendation.text,
              metadata:
                Object.freeze({
                  evidenceLevel:
                    recommendation.evidenceLevel.value,
                  strength:
                    recommendation.strength.value,
                  requiresHumanReview:
                    recommendation.requiresHumanReview,
                }),
            }),
        ),
      );

    const outcomeNode =
      executionResult.outcome
        ? Object.freeze({
            nodeId:
              `GUIDELINE-OUTCOME-${executionResult.outcome.outcomeId}`,
            type: "DECISION",
            label:
              executionResult.outcome.label,
            metadata:
              Object.freeze({
                outcomeType:
                  executionResult.outcome.type,
              }),
          })
        : null;

    return Object.freeze({
      guidelineNode,
      executionNodes,
      recommendationNodes,
      outcomeNode,
    });
  }
}
