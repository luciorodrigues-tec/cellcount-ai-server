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
      visible_nucleoli: 0.9,
      high_nc_ratio: 0.9,
      limited_field: 1,
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
  blast.contributions.length > 0,
);
assert.ok(
  blast.contributions.some(
    (item) =>
      item.featureId ===
      "fine_chromatin" &&
      item.appliedContribution > 0,
  ),
);
assert.ok(
  blast.limitationPenalty > 0,
);

console.log(
  "CI-002C.3 contribution audit passed.",
);
