export const GUIDELINE_STEP_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineStep({
  stepId,
  order,
  nodeId,
  executionMode,
  required = true,
} = {}) {
  if (!stepId || !nodeId || !executionMode) {
    throw new TypeError(
      "GuidelineStep requires stepId, nodeId and executionMode.",
    );
  }

  const numericOrder = Number(order);
  if (
    !Number.isInteger(numericOrder) ||
    numericOrder < 1
  ) {
    throw new TypeError(
      "GuidelineStep.order must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_STEP_SCHEMA_VERSION,
    stepId: String(stepId).trim(),
    order: numericOrder,
    nodeId: String(nodeId).trim(),
    executionMode,
    required: Boolean(required),
  });
}
