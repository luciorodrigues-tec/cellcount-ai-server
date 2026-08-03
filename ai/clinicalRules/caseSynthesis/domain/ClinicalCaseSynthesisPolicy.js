export const CLINICAL_CASE_SYNTHESIS_POLICY_VERSION =
  "CRR-000023-v1.0.0";

export const DEFAULT_CLINICAL_CASE_SYNTHESIS_POLICY =
  Object.freeze({
    version:
      CLINICAL_CASE_SYNTHESIS_POLICY_VERSION,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnIndeterminate: true,
    requireHumanReviewOnMissingClassification: false,
    requireHumanReviewOnMissingEvidence: true,
    blockAutomationOnCriticalRecommendation: true,
    blockAutomationOnAbstention: true,
    maximumCriteriaResults: 50,
    maximumEvidenceResults: 50,
    maximumRecommendations: 20,
  });

export function mergeClinicalCaseSynthesisPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_CLINICAL_CASE_SYNTHESIS_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
