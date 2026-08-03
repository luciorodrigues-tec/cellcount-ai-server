export const DIAGNOSTIC_CONFIDENCE_POLICY_VERSION =
  "CRR-000030-v1.0.0";

export const DEFAULT_DIAGNOSTIC_CONFIDENCE_POLICY = Object.freeze({
  version: DIAGNOSTIC_CONFIDENCE_POLICY_VERSION,
  sourceWeights: Object.freeze({
    classification: 0.15,
    evidence: 0.25,
    syndrome: 0.1,
    reasoning: 0.2,
    consensus: 0.2,
    imageQuality: 0.05,
    multiImageConsistency: 0.05,
  }),
  minimumAutomationScore: 0.65,
  minimumReviewScore: 0.4,
  overconfidenceGap: 0.2,
  underconfidenceGap: 0.2,
  conflictPenalty: 0.2,
  abstentionPenalty: 0.5,
  lowImageQualityPenalty: 0.15,
  minimumImageQuality: 0.45,
  requireHumanReviewOnConflict: true,
  requireHumanReviewOnAbstention: true,
  requireHumanReviewOnOverconfidence: true,
  blockAutomationOnAbstention: true,
  blockAutomationOnConflict: true,
  blockAutomationBelowThreshold: true,
  maximumAuditFactors: 100,
});

export function mergeDiagnosticConfidencePolicy(overrides = {}) {
  return Object.freeze({
    ...DEFAULT_DIAGNOSTIC_CONFIDENCE_POLICY,
    ...(overrides && typeof overrides === "object" ? overrides : {}),
    sourceWeights: Object.freeze({
      ...DEFAULT_DIAGNOSTIC_CONFIDENCE_POLICY.sourceWeights,
      ...(
        overrides.sourceWeights &&
        typeof overrides.sourceWeights === "object"
          ? overrides.sourceWeights
          : {}
      ),
    }),
  });
}
