export class DecisionPathExtractor {
  extract({
    rootNodeId,
    outcomeNodeId,
    edges = [],
  }) {
    if (!outcomeNodeId) {
      return Object.freeze({
        selectedPath: Object.freeze([rootNodeId]),
        alternativePaths: Object.freeze([]),
      });
    }

    const adjacency = new Map();
    for (const edge of edges) {
      if (!adjacency.has(edge.fromNodeId)) {
        adjacency.set(edge.fromNodeId, []);
      }
      adjacency.get(edge.fromNodeId).push(edge.toNodeId);
    }

    const paths = [];
    const queue = [[rootNodeId]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === outcomeNodeId) {
        paths.push(path);
        continue;
      }

      for (const next of adjacency.get(current) || []) {
        if (!path.includes(next)) {
          queue.push([...path, next]);
        }
      }
    }

    return Object.freeze({
      selectedPath: Object.freeze(paths[0] || [rootNodeId]),
      alternativePaths: Object.freeze(
        paths.slice(1).map((path) => Object.freeze(path)),
      ),
    });
  }
}
