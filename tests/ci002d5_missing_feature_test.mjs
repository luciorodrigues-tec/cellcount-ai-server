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
        sharedEvidence: [],
        missingEvidence: [
          {
            featureId:
              "auer_rod",
            group:
              "MISSING_EVIDENCE",
            favors:
              "CELL-A",
            weight: 0.5,
            confidence: 0,
            observed: false,
            missing: true,
          },
        ],
      },
    });

assert.equal(
  result.features[0]
    .missing,
  true,
);

console.log(
  "CI-002D.5 missing feature passed.",
);
