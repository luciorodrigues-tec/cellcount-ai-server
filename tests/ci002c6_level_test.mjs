import assert from "node:assert/strict";

import {
  ConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  new ConfidenceEngine();

const result =
  engine.calculate({
    winner: {
      cellId: "CELL-A",
      normalizedScore: 1,
      coverage: 1,
      requiredCoverage: 1,
      candidate: {
        sourceScore: {},
      },
    },
    ranking: [],
    summary: {
      absoluteMargin: 1,
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
  });

assert.equal(
  result.level,
  "VERY_HIGH",
);

assert.equal(
  result.score,
  1,
);

console.log(
  "CI-002C.6 levels passed.",
);
