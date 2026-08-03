import assert from "node:assert/strict";
import {
  DifferentialRecommendationEngine,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const result =
  new DifferentialRecommendationEngine()
    .analyze({
      conflictResult: {
        pairId: "PAIR-A-B",
        conflictDetected: true,
        conflicts: [],
        severity: {
          score: 0.3,
        },
        probabilities: {
          winnerProbability: 0.35,
          alternativeProbability: 0.65,
        },
        resolution: {
          winnerChanged: true,
          diagnosticTie: false,
          insufficientEvidence: false,
        },
      },
      exclusiveFeatureResult: {
        pairId: "PAIR-A-B",
        pair: {
          rule: {
            recommendedTests: [],
          },
        },
        primaryCell: "CELL-A",
        alternativeCell: "CELL-B",
        features: [],
      },
    });

assert.equal(
  result.recommendations[0].cell,
  "CELL-B",
);

console.log(
  "CI-002D.7 winner change passed.",
);
