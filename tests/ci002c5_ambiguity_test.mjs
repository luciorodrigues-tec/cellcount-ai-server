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
        score: 5,
        normalizedScore: 0.90,
        coverage: 0.9,
        eligible: true,
      },
      {
        cellId: "CELL-B",
        criteriaId: "CRITERIA-B",
        score: 4.9,
        normalizedScore: 0.88,
        coverage: 0.9,
        eligible: true,
      },
    ],
    rejected: [],
    statistics: {},
  });

assert.equal(
  result.summary.ambiguous,
  true,
);

assert.equal(
  result.summary
    .humanReviewRecommended,
  true,
);

assert.ok(
  result.summary
    .reviewReasons
    .includes(
      "AMBIGUOUS_TOP_CANDIDATES",
    ),
);

console.log(
  "CI-002C.5 ambiguity passed.",
);
