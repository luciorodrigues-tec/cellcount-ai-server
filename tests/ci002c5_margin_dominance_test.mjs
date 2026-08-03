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
        cellId: "CELL-A",
        criteriaId: "CRITERIA-A",
        score: 6,
        normalizedScore: 0.92,
        coverage: 0.9,
        eligible: true,
      },
      {
        cellId: "CELL-B",
        criteriaId: "CRITERIA-B",
        score: 3,
        normalizedScore: 0.60,
        coverage: 0.9,
        eligible: true,
      },
    ],
    rejected: [],
    statistics: {},
  });

assert.equal(
  result.summary.absoluteMargin,
  0.32,
);

assert.equal(
  result.summary.dominance,
  "HIGH",
);

assert.equal(
  result.summary.ambiguous,
  false,
);

console.log(
  "CI-002C.5 margin/dominance passed.",
);
