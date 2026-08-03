export const POLICY_VALIDATION_SERVICE_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyValidationService {
  validate(policy) {
    const issues = [];

    if (!policy?.policyId) {
      issues.push("POLICY_ID_MISSING");
    }

    if (!policy?.scope) {
      issues.push("SCOPE_MISSING");
    }

    if (!policy?.version) {
      issues.push("VERSION_MISSING");
    }

    if (
      policy?.status === "ACTIVE" &&
      policy.rules.length === 0 &&
      policy.thresholds.length === 0
    ) {
      issues.push(
        "ACTIVE_POLICY_WITHOUT_RULES_OR_THRESHOLDS",
      );
    }

    return Object.freeze({
      valid: issues.length === 0,
      issues: Object.freeze(issues),
    });
  }
}
