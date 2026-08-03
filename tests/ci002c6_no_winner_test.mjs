import assert from "node:assert/strict";

import {
  ConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  new ConfidenceEngine();

const result =
  engine.calculate({
    winner: null,
    ranking: [],
    summary: {
      humanReviewRecommended: true,
      reviewReasons: [
        "NO_ELIGIBLE_CANDIDATE",
      ],
    },
  });

assert.equal(
  result.available,
  false,
);

assert.equal(
  result.level,
  "UNAVAILABLE",
);

assert.equal(
  result.score,
  0,
);

assert.equal(
  result
    .humanReviewRecommended,
  true,
);

console.log(
  "CI-002C.6 no-winner handling passed.",
);
