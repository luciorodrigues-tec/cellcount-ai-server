import assert from "node:assert/strict";

import {
  RankingEngine,
} from "../ai/ranking/morphologyRanking/index.js";

const engine =
  new RankingEngine();

const result =
  engine.rank({
    eligible: [],
    rejected: [],
    statistics: {},
  });

assert.equal(
  result.winner,
  null,
);

assert.equal(
  result.runnerUp,
  null,
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
      "NO_ELIGIBLE_CANDIDATE",
    ),
);

console.log(
  "CI-002C.5 no-candidate handling passed.",
);
