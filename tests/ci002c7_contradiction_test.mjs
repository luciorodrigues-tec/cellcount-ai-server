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
            contributions: [
              {
                featureId: "limited_field",
                role: "limitation",
                matched: true,
                confidence: 1,
                similarity: 1,
                weight: 1,
                appliedContribution: 0,
                penalty: 0.25,
                label: "Campo limitado",
              },
            ],
          },
        },
      },
      runnerUp: null,
      ranking: [],
      rejected: [],
      summary: {
        absoluteMargin: 1,
        ambiguous: false,
        humanReviewRecommended: true,
        reviewReasons: [
          "LIMITED_FIELD",
        ],
      },
    },
    confidenceResult: {
      score: 0.5,
      level: "LOW",
      humanReviewRecommended: true,
      reviewReasons: [
        "CONFIDENCE_BELOW_HUMAN_REVIEW_THRESHOLD",
      ],
    },
  });

assert.equal(
  result.evidence
    .contradictoryEvidence
    .length,
  1,
);

assert.ok(
  result.humanReviewRecommended,
);

console.log(
  "CI-002C.7 contradiction explanation passed.",
);
