export class EvidenceGraph {
  constructor({
    version,
    policy,
  } = {}) {
    this.version = version;
    this.policy = policy;
    this._nodes = new Map();
    this._edges = new Map();
  }

  addNode(node) {
    const previous =
      this._nodes.get(node.id);

    if (
      previous &&
      this.policy
        ?.deduplicateNodes !== true
    ) {
      throw new Error(
        `Duplicate evidence graph node: ${node.id}`,
      );
    }

    this._nodes.set(
      node.id,
      previous || node,
    );

    return (
      previous || node
    );
  }

  addEdge(edge) {
    const previous =
      this._edges.get(edge.id);

    if (
      previous &&
      this.policy
        ?.deduplicateEdges !== true
    ) {
      throw new Error(
        `Duplicate evidence graph edge: ${edge.id}`,
      );
    }

    this._edges.set(
      edge.id,
      previous || edge,
    );

    return (
      previous || edge
    );
  }

  hasNode(id) {
    return this._nodes.has(id);
  }

  getNode(id) {
    return (
      this._nodes.get(id) ||
      null
    );
  }

  nodesByType(type) {
    return [
      ...this._nodes.values(),
    ].filter(
      (node) =>
        node.type === type,
    );
  }

  outgoing(nodeId) {
    return [
      ...this._edges.values(),
    ].filter(
      (edge) =>
        edge.source === nodeId,
    );
  }

  incoming(nodeId) {
    return [
      ...this._edges.values(),
    ].filter(
      (edge) =>
        edge.target === nodeId,
    );
  }

  snapshot() {
    return Object.freeze({
      version:
        this.version,
      nodeCount:
        this._nodes.size,
      edgeCount:
        this._edges.size,
      nodes:
        Object.freeze([
          ...this._nodes.values(),
        ]),
      edges:
        Object.freeze([
          ...this._edges.values(),
        ]),
      policy:
        this.policy,
    });
  }
}
