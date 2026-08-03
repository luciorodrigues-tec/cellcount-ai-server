import assert from "node:assert/strict";

import {
  ConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  new ConfidenceEngine();

const ranking = [
  {
    cellId: "CELL-A",
  },
  {
    cellId: "CELL-B",
  },
];

const input = {
  winner: {
    cellId: "CELL-A",
    normalizedScore: 0.8,
    coverage: 0.8,
    requiredCoverage: 1,
    candidate: {
      sourceScore: {},
    },
  },
  ranking,
  summary: {
    absoluteMargin: 0.2,
    dominance: "HIGH",
    ambiguous: false,
    tie: false,
    winnerStrength: {
      strongEnough: true,
      reasons: [],
    },
    humanReviewRecommended: false,
    reviewReasons: [],
  },
};

const before =
  input.ranking.map(
    (item) => item.cellId,
  );

const result =
  engine.calculate(input);

const after =
  input.ranking.map(
    (item) => item.cellId,
  );

assert.deepEqual(
  before,
  after,
);

assert.equal(
  result.rankingPreserved,
  true,
);

console.log(
  "CI-002C.6 ranking regression passed.",
);
