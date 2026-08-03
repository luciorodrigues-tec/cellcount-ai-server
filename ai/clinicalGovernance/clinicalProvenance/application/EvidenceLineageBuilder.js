import {
  createLineage,
} from "../domain/Lineage.js";

export const EVIDENCE_LINEAGE_BUILDER_VERSION =
  "CGL-000002-S2-v1.0.0";

export class EvidenceLineageBuilder {
  build(graph, targetNodeId) {
    const incoming = new Map();

    for (const edge of graph.edges) {
      if (!incoming.has(edge.toNodeId)) {
        incoming.set(edge.toNodeId, []);
      }
      incoming.get(edge.toNodeId).push(edge);
    }

    const ancestorNodeIds = [];
    const pathEdgeIds = [];
    const visited = new Set();

    const walk = (nodeId) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      for (const edge of incoming.get(nodeId) || []) {
        pathEdgeIds.push(edge.edgeId);
        ancestorNodeIds.push(edge.fromNodeId);
        walk(edge.fromNodeId);
      }
    };

    walk(targetNodeId);

    return createLineage({
      targetNodeId,
      ancestorNodeIds: [
        ...new Set(ancestorNodeIds),
      ],
      pathEdgeIds: [
        ...new Set(pathEdgeIds),
      ],
      complete:
        graph.nodes.some(
          (node) => node.nodeId === targetNodeId,
        ),
    });
  }
}
