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
      normalizedScore: 0.3,
      coverage: 0.4,
      requiredCoverage: 0.5,
      candidate: {
        sourceScore: {
          limitationPenalty: 2,
        },
      },
    },
    ranking: [],
    summary: {
      absoluteMargin: 0.01,
      dominance: "LOW",
      ambiguous: true,
      tie: false,
      winnerStrength: {
        strongEnough: false,
        reasons: [
          "WINNER_BELOW_MINIMUM_SCORE",
        ],
      },
      humanReviewRecommended: true,
      reviewReasons: [
        "AMBIGUOUS_TOP_CANDIDATES",
      ],
    },
  });

assert.equal(
  result
    .humanReviewRecommended,
  true,
);

assert.ok(
  result.reviewReasons
    .includes(
      "CONFIDENCE_BELOW_HUMAN_REVIEW_THRESHOLD",
    ),
);

console.log(
  "CI-002C.6 human review passed.",
);
