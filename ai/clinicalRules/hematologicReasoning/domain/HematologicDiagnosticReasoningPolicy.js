export const HEMATOLOGIC_DIAGNOSTIC_REASONING_POLICY_VERSION =
  "CRR-000028-v1.0.0";

export const DEFAULT_HEMATOLOGIC_DIAGNOSTIC_REASONING_POLICY =
  Object.freeze({
    version:
      HEMATOLOGIC_DIAGNOSTIC_REASONING_POLICY_VERSION,
    patternWeight: 0.2,
    syndromeWeight: 0.2,
    criteriaWeight: 0.25,
    evidenceWeight: 0.25,
    classificationWeight: 0.1,
    minimumSupportScore: 0.5,
    conflictPenalty: 0.35,
    abstentionPenalty: 1,
    maximumHypotheses: 20,
    requireHumanReviewOnTie: true,
    requireHumanReviewOnConflict: true,
    requireHumanReviewOnAbstention: true,
    blockAutomationOnAbstention: true,
  });

export function mergeHematologicDiagnosticReasoningPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_HEMATOLOGIC_DIAGNOSTIC_REASONING_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
