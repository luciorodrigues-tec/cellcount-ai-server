import {
  createPolicyDecision,
} from "../domain/PolicyDecision.js";

export const POLICY_DECISION_RESOLVER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyDecisionResolver {
  resolve(policy, evaluations = []) {
    const matched =
      evaluations
        .filter((item) => item.matched)
        .sort(
          (a, b) =>
            a.priority - b.priority,
        );

    const matchedRuleIds =
      matched.map((item) => item.ruleId);

    let decision = "ALLOW";
    let requiresHumanReview = false;
    let reason =
      "No blocking policy rule matched.";

    for (const item of matched) {
      if (item.effect === "DENY") {
        decision = "DENY";
        reason =
          item.message ||
          "Policy denied the operation.";
        break;
      }

      if (
        item.effect === "REQUIRE_REVIEW"
      ) {
        decision = "REQUIRE_REVIEW";
        requiresHumanReview = true;
        reason =
          item.message ||
          "Human review is required.";
        break;
      }

      if (
        item.effect === "WARN" &&
        decision === "ALLOW"
      ) {
        decision = "WARN";
        reason =
          item.message ||
          "Policy warning matched.";
      }
    }

    return createPolicyDecision({
      policyId:
        policy.policyId.toString(),
      decision,
      matchedRuleIds,
      reason,
      requiresHumanReview,
    });
  }
}
