export const DIAGNOSTIC_CONSENSUS_POLICY_VERSION =
  "CRR-000029-v1.0.0";

export const DEFAULT_DIAGNOSTIC_CONSENSUS_POLICY =
  Object.freeze({
    version:
      DIAGNOSTIC_CONSENSUS_POLICY_VERSION,
    sourceWeights: Object.freeze({
      MORPHOLOGIC_PATTERN: 0.8,
      HEMATOLOGIC_SYNDROME: 0.85,
      DIAGNOSTIC_CRITERIA: 1,
      DIAGNOSTIC_CLASSIFICATION: 1,
      EVIDENCE_SCORING: 0.95,
      HEMATOLOGIC_REASONING: 1,
      HUMAN_REVIEW: 1,
      OTHER: 0.5,
    }),
    minimumConsensusScore: 0.6,
    minimumAgreementRatio: 0.6,
    divergenceThreshold: 0.35,
    maximumHypotheses: 20,
    requireHumanReviewOnTie: true,
    requireHumanReviewOnDivergence: true,
    requireHumanReviewOnAbstention: true,
    blockAutomationOnBlockingVote: true,
  });

export function mergeDiagnosticConsensusPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_CONSENSUS_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    sourceWeights: Object.freeze({
      ...DEFAULT_DIAGNOSTIC_CONSENSUS_POLICY
        .sourceWeights,
      ...(
        overrides.sourceWeights &&
        typeof overrides.sourceWeights === "object"
          ? overrides.sourceWeights
          : {}
      ),
    }),
  });
}
