import assert from "node:assert/strict";

import {
  RankingEngine,
} from "../ai/ranking/morphologyRanking/index.js";

const engine =
  new RankingEngine();

const result =
  engine.rank({
    specimenType:
      "PERIPHERAL_BLOOD",
    eligible: [
      {
        cellId: "CELL-A",
        criteriaId: "CRITERIA-A",
        score: 5,
        normalizedScore: 0.9,
        coverage: 0.8,
        eligible: true,
        blocked: false,
        excluded: false,
      },
      {
        cellId: "CELL-B",
        criteriaId: "CRITERIA-B",
        score: 4,
        normalizedScore: 0.7,
        coverage: 0.9,
        eligible: true,
        blocked: false,
        excluded: false,
      },
    ],
    rejected: [],
    statistics: {},
  });

assert.equal(
  result.winner.cellId,
  "CELL-A",
);

assert.equal(
  result.runnerUp.cellId,
  "CELL-B",
);

assert.equal(
  result.winner.rank,
  1,
);

assert.equal(
  result.runnerUp.rank,
  2,
);

console.log(
  "CI-002C.5 winner/runner-up passed.",
);
