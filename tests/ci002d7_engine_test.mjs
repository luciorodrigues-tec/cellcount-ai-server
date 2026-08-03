import assert from "node:assert/strict";
import {
  DifferentialRecommendationEngine,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const exclusive = {
  pairId: "PAIR-A-B",
  pair: {
    primaryNormalizedScore: 0.8,
    alternativeNormalizedScore: 0.6,
    rule: {
      recommendedTests: [
        {
          id: "FLOW",
          label: "Citometria",
        },
      ],
    },
  },
  primaryCell: "CELL-A",
  alternativeCell: "CELL-B",
  features: [
    {
      featureId: "a",
      favors: "CELL-A",
      observed: true,
      missing: false,
      discriminationScore: 0.9,
      confidence: 0.9,
    },
    {
      featureId: "b",
      favors: "CELL-B",
      observed: true,
      missing: false,
      discriminationScore: 0.6,
      confidence: 0.8,
    },
  ],
};

const conflict = {
  pairId: "PAIR-A-B",
  conflictDetected: true,
  conflicts: [],
  severity: {
    score: 0.2,
  },
  probabilities: {
    winnerProbability: 0.7,
    alternativeProbability: 0.3,
  },
  resolution: {
    winnerChanged: false,
    diagnosticTie: false,
    insufficientEvidence: false,
  },
};

const result =
  new DifferentialRecommendationEngine()
    .analyze({
      conflictResult:
        conflict,
      exclusiveFeatureResult:
        exclusive,
    });

assert.equal(
  result.recommendations.length,
  2,
);

assert.equal(
  result.recommendations[0]
    .recommendationLevel,
  "PRIMARY",
);

assert.equal(
  result.summary
    .recommendedCorrelation
    .length,
  1,
);

console.log(
  "CI-002D.7 engine passed.",
);
