import {
  createQualityRecommendation,
} from "../domain/QualityRecommendation.js";

export const QUALITY_RECOMMENDATION_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityRecommendationEngine {
  build(findings = []) {
    return Object.freeze(
      findings.map((finding, index) =>
        createQualityRecommendation({
          recommendationId:
            `QA-REC-${index + 1}`,
          text:
            finding.severity === "CRITICAL"
              ? "Suspend automation and perform immediate specialist review."
              : "Review the affected process and document corrective action.",
          priority:
            finding.severity === "CRITICAL"
              ? 1
              : finding.severity === "HIGH"
                ? 10
                : 50,
          relatedFindingIds:
            [finding.findingId],
          requiresHumanReview:
            ["HIGH", "CRITICAL"].includes(
              finding.severity,
            ),
        }),
      ),
    );
  }
}
