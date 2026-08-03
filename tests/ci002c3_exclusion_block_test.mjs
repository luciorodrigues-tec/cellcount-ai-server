import assert from "node:assert/strict";

import {
  createMorphologyScoringEngine,
} from "../ai/scoring/morphologyScore/index.js";

const engine =
  createMorphologyScoringEngine();

const result =
  engine.score(
    {
      abundant_basophilic_cytoplasm: 0.9,
      erythrocyte_skirting: 0.9,
      polymorphic_population: 0.9,
      auer_rod: 1,
    },
    {
      specimenType:
        "PERIPHERAL_BLOOD",
    },
  );

const reactive =
  result.scores.find(
    (item) =>
      item.cellId ===
      "CELL-REACTIVE-LYMPHOCYTE",
  );

assert.ok(reactive);
assert.equal(
  reactive.excluded,
  true,
);
assert.equal(
  reactive.blocked,
  true,
);

console.log(
  "CI-002C.3 exclusion blocking passed.",
);
