import assert from "node:assert/strict";
import {
  DiagnosticConflictEngine,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const result =
  new DiagnosticConflictEngine()
    .analyze({
      exclusiveFeatureResult: {
        pairId: "PAIR-A-B",
        pair: {
          primaryNormalizedScore: 0.8,
          alternativeNormalizedScore: 0.7,
        },
        primaryCell: "CELL-A",
        alternativeCell: "CELL-B",
        features: [
          {
            featureId: "missing",
            favors: "CELL-A",
            observed: false,
            missing: true,
            discriminationScore: 0.9,
            classification: "VERY_HIGH",
          },
        ],
      },
    });

assert.equal(
  result.resolution
    .insufficientEvidence,
  true,
);

console.log(
  "CI-002D.6 insufficient evidence passed.",
);
