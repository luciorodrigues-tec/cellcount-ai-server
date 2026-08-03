export const EVIDENCE_GRAPH_SCHEMA_VERSION =
  "CGL-000002-S1-v1";

export function createEvidenceGraph({
  nodes = [],
  edges = [],
} = {}) {
  const nodeIds =
    new Set(nodes.map((node) => node.nodeId));

  for (const edge of edges) {
    if (
      !nodeIds.has(edge.fromNodeId) ||
      !nodeIds.has(edge.toNodeId)
    ) {
      throw new Error(
        `EvidenceGraph edge references unknown node: ${edge.edgeId}`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      EVIDENCE_GRAPH_SCHEMA_VERSION,
    nodes: Object.freeze([...nodes]),
    edges: Object.freeze([...edges]),
  });
}
