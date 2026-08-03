import assert from "node:assert/strict";

import {
  EvidenceGraphQuery,
} from "../ai/graph/morphologyEvidence/index.js";

const snapshot = {
  nodes: [
    {
      id: "cell:CELL-A",
      type: "CELL",
    },
    {
      id: "feature:x",
      type: "FEATURE",
    },
  ],
  edges: [
    {
      id:
        "feature:x::SUPPORTS::cell:CELL-A",
      source:
        "feature:x",
      target:
        "cell:CELL-A",
      type:
        "SUPPORTS",
    },
  ],
};

const query =
  new EvidenceGraphQuery(
    snapshot,
  );

assert.equal(
  query.node(
    "cell:CELL-A",
  ).type,
  "CELL",
);

assert.equal(
  query.incoming(
    "cell:CELL-A",
  ).length,
  1,
);

assert.equal(
  query.connected(
    "cell:CELL-A",
  ).nodes.length,
  2,
);

console.log(
  "CI-002C.8 query passed.",
);
