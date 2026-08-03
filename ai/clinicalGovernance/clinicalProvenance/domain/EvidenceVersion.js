export const EVIDENCE_VERSION_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createEvidenceVersion({
  version,
  modelVersion = null,
  ruleVersion = null,
  createdAt = null,
} = {}) {
  if (!version || !String(version).trim()) {
    throw new TypeError(
      "EvidenceVersion.version is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      EVIDENCE_VERSION_SCHEMA_VERSION,
    version: String(version).trim(),
    modelVersion:
      modelVersion === null
        ? null
        : String(modelVersion).trim(),
    ruleVersion:
      ruleVersion === null
        ? null
        : String(ruleVersion).trim(),
    createdAt:
      createdAt === null ? null : String(createdAt),
  });
}
