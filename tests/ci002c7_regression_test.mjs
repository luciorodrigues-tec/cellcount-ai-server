import assert from "node:assert/strict";

import {
  ExplanationEngine,
} from "../ai/explanation/morphologyExplanation/index.js";

const engine =
  new ExplanationEngine();

const ranking = [
  {
    cellId: "CELL-A",
  },
  {
    cellId: "CELL-B",
  },
];

const rankingResult = {
  winner: {
    cellId: "CELL-A",
    candidate: {
      sourceScore: {
        summary: {},
        contributions: [],
      },
    },
  },
  runnerUp: {
    cellId: "CELL-B",
  },
  ranking,
  rejected: [],
  summary: {
    absoluteMargin: 0.1,
    ambiguous: false,
    humanReviewRecommended: false,
    reviewReasons: [],
  },
};

const confidenceResult = {
  score: 0.75,
  level: "HIGH",
  humanReviewRecommended: false,
  reviewReasons: [],
};

const beforeRanking =
  ranking.map(
    (item) =>
      item.cellId,
  );

const beforeConfidence =
  confidenceResult.score;

const result =
  engine.explain({
    rankingResult,
    confidenceResult,
  });

assert.deepEqual(
  ranking.map(
    (item) =>
      item.cellId,
  ),
  beforeRanking,
);

assert.equal(
  confidenceResult.score,
  beforeConfidence,
);

assert.equal(
  result.rankingPreserved,
  true,
);

assert.equal(
  result.confidencePreserved,
  true,
);

console.log(
  "CI-002C.7 regression guard passed.",
);
