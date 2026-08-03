import assert from "node:assert/strict";

import {
  calculateRankingSupport,
  calculateConfidenceSupport,
} from "../ai/differentialDiagnosis/similarityCalculator/index.js";

const ranking =
  calculateRankingSupport({
    primaryNormalizedScore: 0.9,
    alternativeNormalizedScore: 0.85,
    marginFromWinner: 0.05,
  });

const confidence =
  calculateConfidenceSupport({
    score: 0.88,
    available: true,
    level: "HIGH",
  });

assert.ok(
  ranking.score > 0.8,
);

assert.equal(
  confidence.score,
  0.88,
);

console.log(
  "CI-002D.3 ranking/confidence support passed.",
);
