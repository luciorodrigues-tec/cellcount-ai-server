export const CLINICAL_POLICY_AUDIT_ADAPTER_VERSION =
  "CGL-000003-S3-v1.0.0";

export class ClinicalPolicyAuditAdapter {
  toAuditPayload({
    policy,
    result,
  } = {}) {
    if (!policy || !result?.decision) {
      throw new TypeError(
        "ClinicalPolicyAuditAdapter requires policy and decision result.",
      );
    }

    return Object.freeze({
      policyId:
        policy.policyId.toString(),
      policyVersion:
        policy.version.version,
      policyScope:
        policy.scope.type,
      matchedRuleIds:
        result.decision.matchedRuleIds,
      decision:
        result.decision.decision,
      requiresHumanReview:
        result.decision.requiresHumanReview,
      activeOverrideIds:
        Object.freeze(
          (result.activeOverrides || []).map(
            (override) =>
              override.overrideId,
          ),
        ),
    });
  }
}
