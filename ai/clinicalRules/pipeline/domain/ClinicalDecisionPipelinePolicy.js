export const CLINICAL_DECISION_PIPELINE_POLICY_VERSION =
  "CRR-000012-v1.0.0";

export const DEFAULT_CLINICAL_DECISION_PIPELINE_POLICY =
  Object.freeze({
    version:
      CLINICAL_DECISION_PIPELINE_POLICY_VERSION,
    maximumImages: 4,
    allowEmptyImages: true,
    requireManualCountsObject: false,
    includeOrchestration: true,
    includeIntermediateOutputs: false,
    failOnValidationError: true,
    requireHumanReviewOnPipelineError: true,
  });

export function mergeClinicalDecisionPipelinePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_CLINICAL_DECISION_PIPELINE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
