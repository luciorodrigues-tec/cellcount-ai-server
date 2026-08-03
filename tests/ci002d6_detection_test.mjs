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
          primaryNormalizedScore: 0.9,
          alternativeNormalizedScore: 0.8,
        },
        primaryCell: "CELL-A",
        alternativeCell: "CELL-B",
        features: [
          {
            featureId: "a",
            favors: "CELL-A",
            observed: true,
            missing: false,
            discriminationScore: 0.8,
            classification: "VERY_HIGH",
          },
          {
            featureId: "b",
            favors: "CELL-B",
            observed: true,
            missing: false,
            discriminationScore: 0.75,
            classification: "HIGH",
          },
        ],
      },
    });

assert.equal(
  result.conflictDetected,
  true,
);

assert.ok(
  result.conflicts.some(
    (item) =>
      item.type ===
      "CROSS_HYPOTHESIS_CONFLICT",
  ),
);

console.log(
  "CI-002D.6 conflict detection passed.",
);
