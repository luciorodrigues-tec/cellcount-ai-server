export const GUIDELINE_NODE_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const GUIDELINE_NODE_TYPES = Object.freeze([
  "START",
  "DECISION",
  "ACTION",
  "RECOMMENDATION",
  "OUTCOME",
]);

export function createGuidelineNode({
  nodeId,
  type,
  label,
  conditionIds = [],
  recommendationIds = [],
  branchIds = [],
  outcomeId = null,
  metadata = {},
} = {}) {
  if (!nodeId || !type || !label) {
    throw new TypeError(
      "GuidelineNode requires nodeId, type and label.",
    );
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!GUIDELINE_NODE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported guideline node type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_NODE_SCHEMA_VERSION,
    nodeId: String(nodeId).trim(),
    type: normalizedType,
    label: String(label).trim(),
    conditionIds:
      Object.freeze([...conditionIds]),
    recommendationIds:
      Object.freeze([...recommendationIds]),
    branchIds:
      Object.freeze([...branchIds]),
    outcomeId:
      outcomeId === null
        ? null
        : String(outcomeId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
