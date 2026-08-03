import assert from "node:assert/strict";

import {
  RankingEngine,
} from "../ai/ranking/morphologyRanking/index.js";

const engine =
  new RankingEngine();

const input = {
  eligible: [
    {
      cellId: "CELL-C",
      criteriaId: "CRITERIA-C",
      score: 5,
      normalizedScore: 0.8,
      coverage: 0.7,
      eligible: true,
    },
    {
      cellId: "CELL-A",
      criteriaId: "CRITERIA-A",
      score: 5,
      normalizedScore: 0.8,
      coverage: 0.9,
      eligible: true,
    },
    {
      cellId: "CELL-B",
      criteriaId: "CRITERIA-B",
      score: 6,
      normalizedScore: 0.9,
      coverage: 0.8,
      eligible: true,
    },
  ],
  rejected: [],
  statistics: {},
};

const first =
  engine.rank(input);

const second =
  engine.rank(input);

assert.deepEqual(
  first.ranking.map(
    (item) => item.cellId,
  ),
  second.ranking.map(
    (item) => item.cellId,
  ),
);

assert.deepEqual(
  first.ranking.map(
    (item) => item.cellId,
  ),
  [
    "CELL-B",
    "CELL-A",
    "CELL-C",
  ],
);

console.log(
  "CI-002C.5 deterministic sort regression passed.",
);
