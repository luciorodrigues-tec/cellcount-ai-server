export class DecisionTreeGraphValidator {
  validate({ nodes = [], edges = [], rootNodeId, outcomeNodeId = null }) {
    const nodeIds = new Set(nodes.map((node) => node.id));
    const adjacency = new Map();

    for (const node of nodes) {
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      if (
        !nodeIds.has(edge.fromNodeId) ||
        !nodeIds.has(edge.toNodeId)
      ) {
        throw new Error(
          `Decision tree edge references unknown node: ${edge.id}`,
        );
      }
      adjacency.get(edge.fromNodeId).push(edge.toNodeId);
    }

    let cycleDetected = false;
    const visiting = new Set();
    const visited = new Set();

    const visit = (nodeId) => {
      if (visiting.has(nodeId)) {
        cycleDetected = true;
        return;
      }
      if (visited.has(nodeId)) return;

      visiting.add(nodeId);
      for (const next of adjacency.get(nodeId) || []) {
        visit(next);
      }
      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    if (nodeIds.has(rootNodeId)) {
      visit(rootNodeId);
    }

    const disconnectedOutcome =
      outcomeNodeId !== null &&
      !visited.has(outcomeNodeId);

    return Object.freeze({
      cycleDetected,
      disconnectedOutcome,
      reachableNodeIds: Object.freeze([...visited]),
    });
  }
}
