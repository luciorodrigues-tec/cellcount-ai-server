export const POLICY_STATUS_VERSION =
  "CGL-000003-S1-v1.0.0";

export const POLICY_STATUSES = Object.freeze([
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "RETIRED",
]);

export function assertPolicyStatus(value) {
  const normalized =
    String(value || "").trim().toUpperCase();

  if (!POLICY_STATUSES.includes(normalized)) {
    throw new TypeError(
      `Unsupported policy status: ${normalized}`,
    );
  }

  return normalized;
}
