import assert from "node:assert/strict";
import {
  DifferentialRecommendationEngine,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const conflict = {
  pairId: "PAIR-A-B",
  conflictDetected: false,
  conflicts: [],
  severity: {
    score: 0.1,
  },
  probabilities: {
    winnerProbability: 0.8,
    alternativeProbability: 0.2,
  },
  resolution: {
    winnerChanged: false,
    diagnosticTie: false,
    insufficientEvidence: false,
  },
};

const exclusive = {
  pairId: "PAIR-A-B",
  pair: {
    rule: {
      recommendedTests: [],
    },
  },
  primaryCell: "CELL-A",
  alternativeCell: "CELL-B",
  features: [],
};

const beforeConflict =
  JSON.stringify(conflict);

const beforeExclusive =
  JSON.stringify(exclusive);

new DifferentialRecommendationEngine()
  .analyze({
    conflictResult: conflict,
    exclusiveFeatureResult:
      exclusive,
  });

assert.equal(
  JSON.stringify(conflict),
  beforeConflict,
);

assert.equal(
  JSON.stringify(exclusive),
  beforeExclusive,
);

console.log(
  "CI-002D.7 regression guard passed.",
);
