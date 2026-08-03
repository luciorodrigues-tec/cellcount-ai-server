export const DATA_ORIGIN_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export const DATA_ORIGIN_TYPES = Object.freeze([
  "IMAGE",
  "ROI",
  "CELL",
  "MANUAL_INPUT",
  "LABORATORY",
  "CLINICAL",
  "RULE",
  "MODEL",
  "EXTERNAL_SYSTEM",
  "OTHER",
]);

export function createDataOrigin({
  originId,
  type,
  source,
  acquiredAt = null,
  hash = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    originId,
    type,
    source,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DataOrigin.${field} is required.`,
      );
    }
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!DATA_ORIGIN_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported data origin type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion: DATA_ORIGIN_SCHEMA_VERSION,
    originId: String(originId).trim(),
    type: normalizedType,
    source: String(source).trim(),
    acquiredAt:
      acquiredAt === null ? null : String(acquiredAt),
    hash: hash === null ? null : String(hash).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
