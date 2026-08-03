export const GUIDELINE_VERSION_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineVersion({
  version,
  effectiveFrom,
  effectiveUntil = null,
  supersedes = null,
} = {}) {
  if (!version || !String(version).trim()) {
    throw new TypeError(
      "GuidelineVersion.version is required.",
    );
  }

  if (!effectiveFrom) {
    throw new TypeError(
      "GuidelineVersion.effectiveFrom is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_VERSION_SCHEMA_VERSION,
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
