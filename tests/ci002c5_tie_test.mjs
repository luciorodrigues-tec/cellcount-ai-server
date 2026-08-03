import assert from "node:assert/strict";

import {
  RankingEngine,
} from "../ai/ranking/morphologyRanking/index.js";

const engine =
  new RankingEngine();

const result =
  engine.rank({
    eligible: [
      {
        cellId: "CELL-B",
        criteriaId: "CRITERIA-B",
        score: 4,
        normalizedScore: 0.8,
        coverage: 0.8,
        eligible: true,
      },
      {
        cellId: "CELL-A",
        criteriaId: "CRITERIA-A",
        score: 4,
        normalizedScore: 0.8,
        coverage: 0.8,
        eligible: true,
      },
    ],
    rejected: [],
    statistics: {},
  });

assert.equal(
  result.summary.tie,
  true,
);

assert.equal(
  result.winner.cellId,
  "CELL-A",
);

assert.equal(
  result.summary
    .humanReviewRecommended,
  true,
);

console.log(
  "CI-002C.5 tie handling passed.",
);
