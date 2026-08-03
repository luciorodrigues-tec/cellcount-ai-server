import assert from "node:assert/strict";

import {
  EvidenceGraph,
  createEvidenceGraphNode,
  createEvidenceGraphEdge,
} from "../ai/graph/morphologyEvidence/index.js";

const graph =
  new EvidenceGraph({
    version: "test",
    policy: {
      deduplicateNodes: true,
      deduplicateEdges: true,
    },
  });

const node =
  createEvidenceGraphNode({
    id: "cell:A",
    type: "CELL",
  });

graph.addNode(node);
graph.addNode(node);

const edge =
  createEvidenceGraphEdge({
    source: "cell:A",
    target: "cell:A",
    type: "DERIVED_FROM",
  });

graph.addEdge(edge);
graph.addEdge(edge);

const snapshot =
  graph.snapshot();

assert.equal(
  snapshot.nodeCount,
  1,
);

assert.equal(
  snapshot.edgeCount,
  1,
);

console.log(
  "CI-002C.8 deduplication passed.",
);
