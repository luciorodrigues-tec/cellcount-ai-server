export const DIAGNOSTIC_RANKING_POLICY_VERSION =
  "CRR-000010-v1.0.0";

export const DEFAULT_DIAGNOSTIC_RANKING_POLICY =
  Object.freeze({
    version: DIAGNOSTIC_RANKING_POLICY_VERSION,
    componentWeights: Object.freeze({
      FUSION: 0.35,
      BAYESIAN: 0.30,
      DIFFERENTIAL: 0.20,
      CONSENSUS: 0.15,
    }),
    conflictPenalty: 0.25,
    abstentionPenalty: 0.35,
    exclusionPenalty: 1,
    missingRequiredSourcePenalty: 0.2,
    competitionPenalty: 0.1,
    minimumRankableScore: 0.05,
    maximumHypotheses: 10,
    normalizeScores: true,
    requireHumanReviewOnTopTie: true,
    requireHumanReviewOnConflict: true,
  });

export function mergeDiagnosticRankingPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_RANKING_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    componentWeights: Object.freeze({
      ...DEFAULT_DIAGNOSTIC_RANKING_POLICY
        .componentWeights,
      ...(
        overrides.componentWeights &&
        typeof overrides.componentWeights === "object"
          ? overrides.componentWeights
          : {}
      ),
    }),
  });
}
