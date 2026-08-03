import assert from "node:assert/strict";

import {
  createMorphologyScoringEngine,
} from "../ai/scoring/morphologyScore/index.js";

const engine =
  createMorphologyScoringEngine();

const result =
  engine.score(
    {
      fine_chromatin: 0.95,
      visible_nucleoli: 0.90,
      high_nc_ratio: 0.92,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

const blast =
  result.scores.find(
    (item) =>
      item.cellId ===
      "CELL-BLAST",
  );

assert.ok(blast);
assert.ok(
  blast.positiveScore > 0,
);
assert.equal(
  blast.requiredSatisfied,
  true,
);
assert.ok(
  blast.finalScore > 0,
);

console.log(
  "CI-002C.3 positive score passed.",
);
