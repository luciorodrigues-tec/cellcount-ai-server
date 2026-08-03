export class EvidenceGraphQuery {
  constructor(snapshot) {
    if (
      !snapshot ||
      !Array.isArray(snapshot.nodes) ||
      !Array.isArray(snapshot.edges)
    ) {
      throw new TypeError(
        "Valid evidence graph snapshot is required.",
      );
    }

    this.snapshot = snapshot;
  }

  node(id) {
    return (
      this.snapshot.nodes.find(
        (item) =>
          item.id === id,
      ) || null
    );
  }

  nodesByType(type) {
    return this.snapshot.nodes
      .filter(
        (item) =>
          item.type === type,
      );
  }

  outgoing(id) {
    return this.snapshot.edges
      .filter(
        (item) =>
          item.source === id,
      );
  }

  incoming(id) {
    return this.snapshot.edges
      .filter(
        (item) =>
          item.target === id,
      );
  }

  connected(id) {
    const edgeIds =
      new Set();

    for (
      const edge
      of this.snapshot.edges
    ) {
      if (
        edge.source === id ||
        edge.target === id
      ) {
        edgeIds.add(edge.id);
      }
    }

    const edges =
      this.snapshot.edges
        .filter(
          (edge) =>
            edgeIds.has(edge.id),
        );

    const nodeIds =
      new Set([id]);

    for (const edge of edges) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }

    return Object.freeze({
      nodes:
        Object.freeze(
          this.snapshot.nodes
            .filter(
              (node) =>
                nodeIds.has(node.id),
            ),
        ),
      edges:
        Object.freeze(edges),
    });
  }
}
