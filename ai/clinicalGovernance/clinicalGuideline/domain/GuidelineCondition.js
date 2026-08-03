export const GUIDELINE_CONDITION_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineCondition({
  conditionId,
  expression,
  description = null,
  metadata = {},
} = {}) {
  if (!conditionId || !expression) {
    throw new TypeError(
      "GuidelineCondition requires conditionId and expression.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_CONDITION_SCHEMA_VERSION,
    conditionId: String(conditionId).trim(),
    expression: String(expression).trim(),
    description:
      description === null
        ? null
        : String(description).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
