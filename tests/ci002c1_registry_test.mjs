import assert from "node:assert/strict";

import {
  createCriteriaEngineRegistry,
} from "../ai/knowledge/morphology/index.js";

const engine =
  createCriteriaEngineRegistry();

assert.equal(
  engine.criteriaRegistry
    .snapshot().size,
  15,
);

assert.ok(
  engine.criteriaRegistry
    .getByCellId("CELL-BLAST"),
);

assert.ok(
  engine.criteriaRegistry
    .getByCellId(
      "CELL-MEGAKARYOCYTE",
    ),
);

assert.ok(
  engine.featureCatalog.size > 20,
);

console.log(
  "CI-002C.1 criteria registry passed.",
);
