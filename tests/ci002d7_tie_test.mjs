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
          score: 0.5,
        },
        probabilities: {
          winnerProbability: 0.5,
          alternativeProbability: 0.5,
        },
        resolution: {
          winnerChanged: false,
          diagnosticTie: true,
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

assert.match(
  result.explanation.fullText,
  /permanecem próximas/i,
);

console.log(
  "CI-002D.7 tie passed.",
);
