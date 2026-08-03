import assert from "node:assert/strict";
import {
  fuseFinalDiagnosisConfidence,
  mergeFinalDiagnosisPolicy,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const result =
  fuseFinalDiagnosisConfidence(
    {
      primaryRecommendation: {
        probability: 0.9,
        priorityScore: 0.9,
      },
      winner: {
        normalizedScore: 0.9,
      },
      confidence: {
        score: 0.9,
      },
      evidenceResults: [
        {
          summary: {
            balance: 0.8,
          },
        },
      ],
      exclusiveFeatureResults: [
        {
          statistics: {
            maximumDiscrimination: 0.9,
          },
        },
      ],
      conflicts: [
        {
          severity: {
            score: 0.1,
          },
          resolution: {
            winnerMaintained: true,
          },
        },
      ],
    },
    {
      overallConsistency: 0.9,
    },
    mergeFinalDiagnosisPolicy(),
  );

assert.ok(
  result.overallConfidence > 0.8,
);
assert.ok(
  result.overallConfidence <= 1,
);
console.log(
  "CI-002D.8 confidence fusion passed.",
);
