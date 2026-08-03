import assert from "node:assert/strict";

import {
  createCriteriaEngineRegistry,
} from "../ai/knowledge/morphology/index.js";

const engine =
  createCriteriaEngineRegistry();

const blast =
  engine.criteriaRegistry
    .getByCellId("CELL-BLAST");

assert.throws(
  () =>
    engine.criteriaRegistry
      .register(blast),
  /already registered/,
);

console.log(
  "CI-002C.1 duplicate protection passed.",
);
