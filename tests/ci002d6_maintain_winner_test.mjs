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
          primaryNormalizedScore: 0.95,
          alternativeNormalizedScore: 0.5,
        },
        primaryCell: "CELL-A",
        alternativeCell: "CELL-B",
        features: [
          {
            featureId: "a",
            favors: "CELL-A",
            observed: true,
            missing: false,
            discriminationScore: 0.95,
            classification: "PATHOGNOMONIC",
          },
          {
            featureId: "b",
            favors: "CELL-A",
            observed: true,
            missing: false,
            discriminationScore: 0.8,
            classification: "VERY_HIGH",
          },
        ],
      },
    });

assert.equal(
  result.resolution
    .winnerMaintained,
  true,
);

assert.equal(
  result.resolution
    .finalCell,
  "CELL-A",
);

console.log(
  "CI-002D.6 maintain winner passed.",
);
