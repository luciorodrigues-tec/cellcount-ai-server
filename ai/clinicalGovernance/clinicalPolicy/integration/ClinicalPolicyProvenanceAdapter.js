export const CLINICAL_POLICY_PROVENANCE_ADAPTER_VERSION =
  "CGL-000003-S3-v1.0.0";

export class ClinicalPolicyProvenanceAdapter {
  toProvenancePayload({
    policy,
    result,
  } = {}) {
    if (!policy || !result?.decision) {
      throw new TypeError(
        "ClinicalPolicyProvenanceAdapter requires policy and decision result.",
      );
    }

    const policyNode = Object.freeze({
      nodeId:
        `POLICY-${policy.policyId.toString()}-${policy.version.version}`,
      type: "RULE",
      label: policy.name,
      metadata: Object.freeze({
        policyId:
          policy.policyId.toString(),
        version:
          policy.version.version,
        scope:
          policy.scope.type,
      }),
    });

    const ruleNodes =
      Object.freeze(
        result.evaluations.map(
          (evaluation) =>
            Object.freeze({
              nodeId:
                `POLICY-RULE-${evaluation.ruleId}`,
              type: "RULE",
              label:
                evaluation.ruleId,
              metadata:
                Object.freeze({
                  matched:
                    evaluation.matched,
                  overridden:
                    evaluation.overridden,
                  effect:
                    evaluation.effect,
                  priority:
                    evaluation.priority,
                }),
            }),
        ),
      );

    const decisionNode = Object.freeze({
      nodeId:
        `POLICY-DECISION-${policy.policyId.toString()}`,
      type: "DECISION",
      label:
        result.decision.decision,
      metadata:
        Object.freeze({
          matchedRuleIds:
            result.decision.matchedRuleIds,
          requiresHumanReview:
            result.decision.requiresHumanReview,
        }),
    });

    return Object.freeze({
      policyNode,
      ruleNodes,
      decisionNode,
    });
  }
}
