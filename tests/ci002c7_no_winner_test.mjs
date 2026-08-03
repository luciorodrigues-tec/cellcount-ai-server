import assert from "node:assert/strict";

import {
  ExplanationEngine,
} from "../ai/explanation/morphologyExplanation/index.js";

const engine =
  new ExplanationEngine();

const result =
  engine.explain({
    rankingResult: {
      winner: null,
      runnerUp: null,
      ranking: [],
      rejected: [],
      summary: {
        reviewReasons: [
          "NO_ELIGIBLE_CANDIDATE",
        ],
      },
    },
    confidenceResult: {
      score: 0,
      level: "UNAVAILABLE",
      humanReviewRecommended: true,
      reviewReasons: [
        "CONFIDENCE_UNAVAILABLE",
      ],
    },
  });

assert.equal(
  result.winner,
  null,
);

assert.match(
  result.narrative.headline,
  /Nenhuma hipótese/,
);

assert.equal(
  result.humanReviewRecommended,
  true,
);

console.log(
  "CI-002C.7 no-winner handling passed.",
);
