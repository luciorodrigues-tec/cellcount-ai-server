import assert from "node:assert/strict";

import {
  createMorphologyRankingEngine,
} from "../ai/ranking/morphologyRanking/index.js";

const engine =
  createMorphologyRankingEngine();

const result =
  engine.rankFeatures(
    {
      fine_chromatin: 0.98,
      visible_nucleoli: 0.95,
      high_nc_ratio: 0.97,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(
  result.ranking.ranking.length >= 1,
);

assert.equal(
  result.ranking
    .ranking[0].rank,
  1,
);

assert.equal(
  result.ranking
    .ranking[0].isWinner,
  true,
);

console.log(
  "CI-002C.5 ranking passed.",
);
