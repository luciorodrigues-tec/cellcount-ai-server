export const POLICY_SCOPE_RESOLVER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyScopeResolver {
  matches(scope, context = {}) {
    if (!scope) return false;

    if (scope.type === "GLOBAL") {
      return true;
    }

    const mapping = {
      ORGANIZATION: "organizationId",
      LABORATORY: "laboratoryId",
      DEPARTMENT: "departmentId",
      WORKFLOW: "workflowId",
      ENGINE: "engineId",
    };

    const field = mapping[scope.type];

    if (!field) {
      return false;
    }

    return String(context[field] || "") ===
      String(scope.targetId || "");
  }
}
