import assert from "node:assert/strict";

import {
  ConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  new ConfidenceEngine();

function ranking(margin) {
  return {
    winner: {
      cellId: "CELL-A",
      normalizedScore: 0.9,
      coverage: 0.9,
      requiredCoverage: 1,
      candidate: {
        sourceScore: {},
      },
    },
    ranking: [],
    summary: {
      absoluteMargin: margin,
      dominance:
        margin >= 0.15
          ? "HIGH"
          : "LOW",
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
}

const high =
  engine.calculate(
    ranking(0.25),
  );

const low =
  engine.calculate(
    ranking(0.02),
  );

assert.ok(
  high.score > low.score,
);

console.log(
  "CI-002C.6 margin weight passed.",
);
