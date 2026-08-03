import assert from "node:assert/strict";

import {
  ExplanationEngine,
} from "../ai/explanation/morphologyExplanation/index.js";

const engine =
  new ExplanationEngine();

const result =
  engine.explain({
    rankingResult: {
      winner: {
        rank: 1,
        cellId: "CELL-A",
        candidate: {
          sourceScore: {
            summary: {},
            contributions: [],
          },
        },
      },
      runnerUp: {
        rank: 2,
        cellId: "CELL-B",
      },
      ranking: [
        {
          rank: 1,
          cellId: "CELL-A",
          score: 5,
          normalizedScore: 0.9,
          coverage: 0.9,
          requiredCoverage: 1,
          marginFromWinner: 0,
        },
        {
          rank: 2,
          cellId: "CELL-B",
          score: 4.8,
          normalizedScore: 0.88,
          coverage: 0.9,
          requiredCoverage: 1,
          marginFromWinner: 0.02,
        },
      ],
      rejected: [],
      summary: {
        absoluteMargin: 0.02,
        ambiguous: true,
        humanReviewRecommended: true,
        reviewReasons: [
          "AMBIGUOUS_TOP_CANDIDATES",
        ],
      },
    },
    confidenceResult: {
      score: 0.6,
      level: "MODERATE",
      humanReviewRecommended: true,
      reviewReasons: [],
    },
  });

assert.equal(
  result.alternatives.length,
  1,
);

assert.equal(
  result.alternatives[0]
    .cellId,
  "CELL-B",
);

assert.match(
  result.alternatives[0]
    .reason,
  /muito próxima/,
);

console.log(
  "CI-002C.7 alternatives passed.",
);
