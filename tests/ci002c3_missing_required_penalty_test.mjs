import assert from "node:assert/strict";

import {
  createMorphologyScoringEngine,
} from "../ai/scoring/morphologyScore/index.js";

const engine =
  createMorphologyScoringEngine();

const result =
  engine.score(
    {
      visible_nucleoli: 0.95,
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
  blast.requiredPenalty > 0,
);
assert.equal(
  blast.requiredSatisfied,
  false,
);

console.log(
  "CI-002C.3 missing required penalty passed.",
);
