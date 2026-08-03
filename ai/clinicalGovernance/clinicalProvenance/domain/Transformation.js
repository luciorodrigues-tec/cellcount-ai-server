export const TRANSFORMATION_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createTransformation({
  transformationId,
  name,
  engineId,
  engineVersion,
  inputNodeIds = [],
  outputNodeIds = [],
  startedAt = null,
  completedAt = null,
  parameters = {},
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    transformationId,
    name,
    engineId,
    engineVersion,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `Transformation.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      TRANSFORMATION_SCHEMA_VERSION,
    transformationId:
      String(transformationId).trim(),
    name: String(name).trim(),
    engineId: String(engineId).trim(),
    engineVersion: String(engineVersion).trim(),
    inputNodeIds:
      Object.freeze([...inputNodeIds]),
    outputNodeIds:
      Object.freeze([...outputNodeIds]),
    startedAt:
      startedAt === null ? null : String(startedAt),
    completedAt:
      completedAt === null ? null : String(completedAt),
    parameters: Object.freeze({ ...parameters }),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
