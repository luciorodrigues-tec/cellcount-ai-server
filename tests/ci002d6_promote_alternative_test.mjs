import assert from "node:assert/strict";
import {
  DiagnosticConflictEngine,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const result =
  new DiagnosticConflictEngine({
    policy: {
      alternativePromotionMargin:
        0.05,
      maximumProbabilityShift:
        0.8,
    },
  }).analyze({
    exclusiveFeatureResult: {
      pairId: "PAIR-A-B",
      pair: {
        primaryNormalizedScore: 0.55,
        alternativeNormalizedScore: 0.54,
      },
      primaryCell: "CELL-A",
      alternativeCell: "CELL-B",
      features: [
        {
          featureId: "b1",
          favors: "CELL-B",
          observed: true,
          missing: false,
          discriminationScore: 1,
          classification: "PATHOGNOMONIC",
        },
        {
          featureId: "b2",
          favors: "CELL-B",
          observed: true,
          missing: false,
          discriminationScore: 0.95,
          classification: "PATHOGNOMONIC",
        },
      ],
    },
  });

assert.equal(
  result.resolution
    .winnerChanged,
  true,
);

assert.equal(
  result.resolution
    .finalCell,
  "CELL-B",
);

console.log(
  "CI-002D.6 promote alternative passed.",
);
