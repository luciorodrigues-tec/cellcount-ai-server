import assert from "node:assert/strict";

import {
  createCellKnowledgeRegistry,
} from "../ai/knowledge/morphology/index.js";

const registry =
  createCellKnowledgeRegistry();

assert.equal(
  registry.snapshot().size,
  15,
);

assert.ok(
  registry.get("CELL-BLAST"),
);

assert.ok(
  registry.get(
    "CELL-MEGAKARYOCYTE",
  ),
);

assert.ok(
  registry.search(
    "linfócito ativado",
  ).length >= 1,
);

assert.ok(
  registry.list({
    lineage: "myeloid",
  }).length >= 3,
);

assert.ok(
  registry.list({
    specimenType:
      "BONE_MARROW_ASPIRATE",
  }).length >= 10,
);

console.log(
  "CI-002B.1 registry passed.",
);
