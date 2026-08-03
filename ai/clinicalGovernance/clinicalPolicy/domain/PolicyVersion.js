export const POLICY_VERSION_SCHEMA_VERSION =
  "CGL-000003-S1-v1";

export function createPolicyVersion({
  version,
  effectiveFrom,
  effectiveUntil = null,
  supersedes = null,
} = {}) {
  if (!version || !String(version).trim()) {
    throw new TypeError(
      "PolicyVersion.version is required.",
    );
  }

  if (!effectiveFrom) {
    throw new TypeError(
      "PolicyVersion.effectiveFrom is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      POLICY_VERSION_SCHEMA_VERSION,
    version: String(version).trim(),
    effectiveFrom: String(effectiveFrom),
    effectiveUntil:
      effectiveUntil === null
        ? null
        : String(effectiveUntil),
    supersedes:
      supersedes === null
        ? null
        : String(supersedes).trim(),
  });
}
