export const PIPELINE_STEP_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createPipelineStep({
  stepId,
  order,
  name,
  transformationIds = [],
  nodeIds = [],
} = {}) {
  for (const [field, value] of Object.entries({
    stepId,
    order,
    name,
  })) {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ""
    ) {
      throw new TypeError(
        `PipelineStep.${field} is required.`,
      );
    }
  }

  const numericOrder = Number(order);
  if (!Number.isInteger(numericOrder) || numericOrder < 1) {
    throw new TypeError(
      "PipelineStep.order must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      PIPELINE_STEP_SCHEMA_VERSION,
    stepId: String(stepId).trim(),
    order: numericOrder,
    name: String(name).trim(),
    transformationIds:
      Object.freeze([...transformationIds]),
    nodeIds:
      Object.freeze([...nodeIds]),
  });
}
