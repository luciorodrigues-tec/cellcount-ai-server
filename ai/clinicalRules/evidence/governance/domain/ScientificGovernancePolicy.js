export const SCIENTIFIC_GOVERNANCE_POLICY_VERSION =
  "CRR-000004-v1.0.0";

export const DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY =
  Object.freeze({
    version: SCIENTIFIC_GOVERNANCE_POLICY_VERSION,
    requiredReviewerRoles: Object.freeze([
      "SCIENTIFIC_REVIEWER",
      "CLINICAL_REVIEWER",
    ]),
    requiredApproverRoles: Object.freeze([
      "APPROVER",
    ]),
    minimumReviewerCount: 2,
    minimumApproverCount: 1,
    allowSelfApproval: false,
    requireDecisionRationale: true,
    requireEffectiveFromForApproval: true,
    requireStructuredSourcesForNonUnspecifiedEvidence: true,
  });

export function mergeScientificGovernancePolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
    requiredReviewerRoles: Object.freeze([
      ...(
        overrides.requiredReviewerRoles ||
        DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY
          .requiredReviewerRoles
      ),
    ]),
    requiredApproverRoles: Object.freeze([
      ...(
        overrides.requiredApproverRoles ||
        DEFAULT_SCIENTIFIC_GOVERNANCE_POLICY
          .requiredApproverRoles
      ),
    ]),
  });
}
