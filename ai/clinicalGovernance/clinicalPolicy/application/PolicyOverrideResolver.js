export const POLICY_OVERRIDE_RESOLVER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyOverrideResolver {
  resolve(overrides = [], {
    now = new Date(),
  } = {}) {
    const current = now instanceof Date
      ? now
      : new Date(now);

    return Object.freeze(
      overrides.filter((override) => {
        if (!override.validUntil) {
          return true;
        }

        return new Date(override.validUntil) >= current;
      }),
    );
  }

  isOverridden(ruleId, overrides = []) {
    return overrides.some(
      (override) =>
        override.targetRuleId === ruleId,
    );
  }
}
