import assert from "node:assert/strict";

import {
  ConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  new ConfidenceEngine();

function input(withPenalties) {
  return {
    winner: {
      cellId: "CELL-A",
      normalizedScore: 0.9,
      coverage: 0.9,
      requiredCoverage: 1,
      candidate: {
        sourceScore:
          withPenalties
            ? {
                limitationPenalty: 2,
                negativePenalty: 1,
                requiredPenalty: 1,
              }
            : {},
      },
    },
    ranking: [],
    summary: {
      absoluteMargin: 0.2,
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
  };
}

const clean =
  engine.calculate(
    input(false),
  );

const penalized =
  engine.calculate(
    input(true),
  );

assert.ok(
  clean.score >
  penalized.score,
);

assert.ok(
  penalized.penalties
    .totalPenalty > 0,
);

console.log(
  "CI-002C.6 penalties passed.",
);
