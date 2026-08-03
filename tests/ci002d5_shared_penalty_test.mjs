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
        winnerEvidence: [],
        alternativeEvidence: [],
        sharedEvidence: [
          {
            featureId:
              "fine_chromatin",
            group:
              "SHARED_EVIDENCE",
            favors:
              "BOTH",
            weight: 0.8,
            confidence: 1,
            observed: true,
          },
        ],
        missingEvidence: [],
      },
    });

assert.equal(
  result.features.length,
  1,
);

assert.notEqual(
  result.features[0]
    .classification,
  "PATHOGNOMONIC",
);

console.log(
  "CI-002D.5 shared feature penalty passed.",
);
