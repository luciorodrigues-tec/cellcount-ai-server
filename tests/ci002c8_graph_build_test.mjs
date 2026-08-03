import assert from "node:assert/strict";

import {
  createMorphologyEvidenceGraphEngine,
} from "../ai/graph/morphologyEvidence/index.js";

const engine =
  createMorphologyEvidenceGraphEngine();

const result =
  engine.analyze(
    {
      fine_chromatin: 1,
      visible_nucleoli: 1,
      high_nc_ratio: 1,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(
  result.graph.nodeCount > 0,
);

assert.ok(
  result.graph.edgeCount > 0,
);

assert.ok(
  result.graph.nodes.some(
    (node) =>
      node.type === "DECISION",
  ),
);

assert.ok(
  result.graph.nodes.some(
    (node) =>
      node.type === "CELL",
  ),
);

console.log(
  "CI-002C.8 graph build passed.",
);
