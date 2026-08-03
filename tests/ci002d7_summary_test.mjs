import assert from "node:assert/strict";
import {
  buildRecommendationSummary,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const summary =
  buildRecommendationSummary({
    recommendations: [
      {
        cell: "CELL-A",
        recommendationLevel: "PRIMARY",
        confidence: 0.8,
      },
      {
        cell: "CELL-B",
        recommendationLevel: "SECONDARY",
        confidence: 0.6,
      },
    ],
    recommendedCorrelation: [],
    limitations: [],
    safetyStatement: "safe",
  });

assert.equal(
  summary.statistics
    .recommendationCount,
  2,
);

assert.equal(
  summary.statistics.primary,
  1,
);

console.log(
  "CI-002D.7 summary passed.",
);
