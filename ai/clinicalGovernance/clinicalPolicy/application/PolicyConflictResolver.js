export const POLICY_CONFLICT_RESOLVER_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyConflictResolver {
  resolve(decisions = []) {
    const precedence = {
      DENY: 4,
      REQUIRE_REVIEW: 3,
      WARN: 2,
      ALLOW: 1,
    };

    return [...decisions].sort(
      (a, b) =>
        (precedence[b.decision] || 0) -
        (precedence[a.decision] || 0),
    )[0] || null;
  }
}
