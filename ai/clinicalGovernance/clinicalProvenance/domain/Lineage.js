export const LINEAGE_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createLineage({
  targetNodeId,
  ancestorNodeIds = [],
  pathEdgeIds = [],
  complete = true,
} = {}) {
  if (!targetNodeId || !String(targetNodeId).trim()) {
    throw new TypeError(
      "Lineage.targetNodeId is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      LINEAGE_SCHEMA_VERSION,
    targetNodeId:
      String(targetNodeId).trim(),
    ancestorNodeIds:
      Object.freeze([...ancestorNodeIds]),
    pathEdgeIds:
      Object.freeze([...pathEdgeIds]),
    complete: Boolean(complete),
  });
}
