export const MULTI_EVIDENCE_FUSION_POLICY_VERSION =
  "CRR-000009-v1.0.0";

export const DEFAULT_MULTI_EVIDENCE_FUSION_POLICY =
  Object.freeze({
    version:
      MULTI_EVIDENCE_FUSION_POLICY_VERSION,
    sourceWeights: Object.freeze({
      CLINICAL_RULE: 1,
      RULE_TRACE: 1,
      SCIENTIFIC_EVIDENCE: 1.2,
      GUIDELINE: 1.3,
      CONSENSUS: 1.1,
      DIFFERENTIAL: 1.1,
      BAYESIAN: 1.25,
      MORPHOLOGY: 1,
      MANUAL_COUNT: 1,
      AI_VISION: 0.9,
      AI_REASONING: 0.8,
      SAFETY_GUARD: 1.5,
      OTHER: 1,
    }),
    evidenceWeights: Object.freeze({
      UNSPECIFIED: 1,
      EXPERT_CONSENSUS: 1.05,
      OBSERVATIONAL: 1.1,
      VALIDATED_COHORT: 1.2,
      SYSTEMATIC_REVIEW: 1.3,
      GUIDELINE: 1.4,
      REGULATORY: 1.5,
    }),
    supportThreshold: 0.6,
    opposeThreshold: 0.6,
    conflictThreshold: 0.25,
    minimumDecisionWeight: 1,
    abstainOnBlockingSignal: true,
    abstainOnHumanReviewSignal: false,
    deduplicateBySource: true,
    maximumSignalsPerTarget: 200,
  });

export function mergeMultiEvidenceFusionPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_MULTI_EVIDENCE_FUSION_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    sourceWeights: Object.freeze({
      ...DEFAULT_MULTI_EVIDENCE_FUSION_POLICY
        .sourceWeights,
      ...(
        overrides.sourceWeights &&
        typeof overrides.sourceWeights === "object"
          ? overrides.sourceWeights
          : {}
      ),
    }),
    evidenceWeights: Object.freeze({
      ...DEFAULT_MULTI_EVIDENCE_FUSION_POLICY
        .evidenceWeights,
      ...(
        overrides.evidenceWeights &&
        typeof overrides.evidenceWeights === "object"
          ? overrides.evidenceWeights
          : {}
      ),
    }),
  });
}
