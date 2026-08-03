export const BAYESIAN_CONFIDENCE_POLICY_VERSION =
  "CRR-000008-v1.0.0";

export const DEFAULT_BAYESIAN_CONFIDENCE_POLICY =
  Object.freeze({
    version:
      BAYESIAN_CONFIDENCE_POLICY_VERSION,
    minimumPosteriorProbability: 0.5,
    highConfidenceThreshold: 0.8,
    moderateConfidenceThreshold: 0.65,
    minimumEvidenceCount: 1,
    abstainOnHumanReviewEvidence: true,
    abstainOnMissingProfile: true,
    maximumEvidenceItems: 100,
    calibrationSlope: 1,
    calibrationIntercept: 0,
  });

export function mergeBayesianConfidencePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_BAYESIAN_CONFIDENCE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
