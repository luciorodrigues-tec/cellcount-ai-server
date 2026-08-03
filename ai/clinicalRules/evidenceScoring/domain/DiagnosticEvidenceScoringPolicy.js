export const DIAGNOSTIC_EVIDENCE_SCORING_POLICY_VERSION =
  "CRR-000021-v1.0.0";

export const DEFAULT_DIAGNOSTIC_EVIDENCE_SCORING_POLICY =
  Object.freeze({
    version:
      DIAGNOSTIC_EVIDENCE_SCORING_POLICY_VERSION,
    sourceTypeWeights: Object.freeze({
      MORPHOLOGY: 1,
      CLINICAL_RULE: 0.9,
      DIAGNOSTIC_CRITERIA: 1,
      DIAGNOSTIC_CLASSIFICATION: 1,
      SCIENTIFIC_EVIDENCE: 0.95,
      GUIDELINE: 0.95,
      CONSENSUS: 0.9,
      BAYESIAN: 0.9,
      FUSION: 0.9,
      HUMAN_REVIEW: 1,
      OTHER: 0.5,
    }),
    opposePenaltyMultiplier: 1,
    conflictThreshold: 0.25,
    minimumSupportScore: 0.05,
    abstainOnBlockingSignal: true,
    normalizeFinalScore: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnAbstention: true,
    maximumSignalsPerHypothesis: 100,
  });

export function mergeDiagnosticEvidenceScoringPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_EVIDENCE_SCORING_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    sourceTypeWeights: Object.freeze({
      ...DEFAULT_DIAGNOSTIC_EVIDENCE_SCORING_POLICY
        .sourceTypeWeights,
      ...(
        overrides.sourceTypeWeights &&
        typeof overrides.sourceTypeWeights === "object"
          ? overrides.sourceTypeWeights
          : {}
      ),
    }),
  });
}
