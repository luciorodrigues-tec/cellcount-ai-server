export const SOURCE_REFERENCE_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createSourceReference({
  sourceId,
  sourceType,
  uri = null,
  version = null,
  checksum = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    sourceId,
    sourceType,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `SourceReference.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      SOURCE_REFERENCE_SCHEMA_VERSION,
    sourceId: String(sourceId).trim(),
    sourceType:
      String(sourceType).trim().toUpperCase(),
    uri: uri === null ? null : String(uri).trim(),
    version:
      version === null ? null : String(version).trim(),
    checksum:
      checksum === null ? null : String(checksum).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
