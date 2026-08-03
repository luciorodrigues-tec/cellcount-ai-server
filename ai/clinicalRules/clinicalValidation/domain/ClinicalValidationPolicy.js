export const CLINICAL_VALIDATION_POLICY_VERSION =
  "CRR-000033-v1.0.0";

export const DEFAULT_CLINICAL_VALIDATION_POLICY =
  Object.freeze({
    version: CLINICAL_VALIDATION_POLICY_VERSION,
    maximumConfidenceUncertaintySum: 1.15,
    minimumEvidenceForSelectedHypothesis: 0,
    requireConsensusReasoningAlignment: true,
    requireClassificationReasoningAlignment: false,
    requireDecisionTreeOutcomeAlignment: true,
    requireReviewPropagation: true,
    blockOnAutomationConflict: true,
    blockOnAbstention: true,
    blockOnDisconnectedDecisionTree: true,
    blockOnDecisionTreeCycle: true,
    warningIssueWeight: 0.25,
    errorIssueWeight: 0.6,
    blockingIssueWeight: 1,
    maximumIssues: 100,
  });

export function mergeClinicalValidationPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_CLINICAL_VALIDATION_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
