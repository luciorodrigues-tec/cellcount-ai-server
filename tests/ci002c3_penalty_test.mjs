import assert from "node:assert/strict";

import {
  createMorphologyScoringEngine,
} from "../ai/scoring/morphologyScore/index.js";

const engine =
  createMorphologyScoringEngine();

const result =
  engine.score(
    {
      fine_chromatin: 0.9,
      visible_nucleoli: 0.9,
      high_nc_ratio: 0.9,
      segmented_nucleus: 0.95,
      specific_mature_granules: 0.9,
    },
    {
      specimenType:
        "PERIPHERAL_BLOOD",
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
  blast.negativePenalty > 0 ||
  blast.exclusionPenalty > 0,
);
assert.ok(
  blast.finalScore <
  blast.positiveScore,
);

console.log(
  "CI-002C.3 penalties passed.",
);
