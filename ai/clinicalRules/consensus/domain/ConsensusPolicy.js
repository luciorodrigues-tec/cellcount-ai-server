export const CONSENSUS_POLICY_VERSION =
  "CRR-000006-v1.0.0";

export const DEFAULT_CONSENSUS_POLICY =
  Object.freeze({
    version: CONSENSUS_POLICY_VERSION,
    minimumTotalWeight: 1,
    minimumSupportWeight: 1,
    minimumSupportRatio: 0.6,
    conflictRatioThreshold: 0.25,
    abstainOnBlockingVote: true,
    abstainOnMissingRequiredRules: true,
    requireAtLeastOneSupportingVote: true,
    evidenceWeights: Object.freeze({
      UNSPECIFIED: 1,
      EXPERT_CONSENSUS: 1.1,
      OBSERVATIONAL: 1.2,
      VALIDATED_COHORT: 1.4,
      SYSTEMATIC_REVIEW: 1.6,
      GUIDELINE: 1.8,
      REGULATORY: 2,
    }),
  });

export function mergeConsensusPolicy(overrides = {}) {
  return Object.freeze({
    ...DEFAULT_CONSENSUS_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    evidenceWeights: Object.freeze({
      ...DEFAULT_CONSENSUS_POLICY.evidenceWeights,
      ...(
        overrides.evidenceWeights &&
        typeof overrides.evidenceWeights === "object"
          ? overrides.evidenceWeights
          : {}
      ),
    }),
  });
}
