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
        cellId: "CELL-A",
        candidate: {
          sourceScore: {
            summary: {},
            contributions: [],
          },
        },
      },
      runnerUp: null,
      ranking: [],
      rejected: [
        {
          cellId: "CELL-B",
          score: 0.5,
          normalizedScore: 0.1,
          coverage: 0.2,
          rejectedReasons: [
            "BELOW_MINIMUM_SCORE",
            "BELOW_MINIMUM_COVERAGE",
          ],
        },
      ],
      summary: {
        absoluteMargin: 1,
        ambiguous: false,
        humanReviewRecommended: false,
        reviewReasons: [],
      },
    },
    confidenceResult: {
      score: 0.8,
      level: "HIGH",
      humanReviewRecommended: false,
      reviewReasons: [],
    },
  });

assert.equal(
  result.rejectedCandidates.length,
  1,
);

assert.ok(
  result.rejectedCandidates[0]
    .rejectedReasons
    .includes(
      "BELOW_MINIMUM_SCORE",
    ),
);

console.log(
  "CI-002C.7 rejected candidate explanation passed.",
);
