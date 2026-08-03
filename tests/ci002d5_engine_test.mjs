import assert from "node:assert/strict";
import {
  ExclusiveFeatureEngine,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const result =
  new ExclusiveFeatureEngine()
    .analyze({
      differentialEvidenceResult: {
        pairId: "PAIR-A-B",
        pair: {},
        primaryCell: "CELL-A",
        alternativeCell: "CELL-B",
        winnerEvidence: [
          {
            featureId:
              "perinuclear_hof",
            group:
              "WINNER_EVIDENCE",
            favors:
              "CELL-A",
            weight: 0.9,
            confidence: 0.95,
            observed: true,
          },
        ],
        alternativeEvidence: [],
        sharedEvidence: [],
        missingEvidence: [],
      },
    });

assert.equal(
  result.features.length,
  1,
);

assert.equal(
  result.features[0]
    .featureId,
  "perinuclear_hof",
);

assert.ok(
  result.features[0]
    .discriminationScore > 0,
);

console.log(
  "CI-002D.5 engine passed.",
);
