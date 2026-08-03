import {
  createEvidenceGraph,
} from "../domain/EvidenceGraph.js";

export const EVIDENCE_GRAPH_BUILDER_VERSION =
  "CGL-000002-S2-v1.0.0";

export class EvidenceGraphBuilder {
  build({ nodes = [], edges = [] } = {}) {
    return createEvidenceGraph({ nodes, edges });
  }

  addNode(graph, node) {
    const existing = graph.nodes.some(
      (item) => item.nodeId === node.nodeId,
    );

    if (existing) {
      throw new Error(
        `Evidence node already exists: ${node.nodeId}`,
      );
    }

    return createEvidenceGraph({
      nodes: [...graph.nodes, node],
      edges: graph.edges,
    });
  }

  addEdge(graph, edge) {
    const existing = graph.edges.some(
      (item) => item.edgeId === edge.edgeId,
    );

    if (existing) {
      throw new Error(
        `Evidence edge already exists: ${edge.edgeId}`,
      );
    }

    return createEvidenceGraph({
      nodes: graph.nodes,
      edges: [...graph.edges, edge],
    });
  }
}
