import assert from "node:assert/strict";
import {
  ExclusiveFeatureEngine,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const evidence = {
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
      confidence: 0.9,
      observed: true,
    },
  ],
  alternativeEvidence: [],
  sharedEvidence: [],
  missingEvidence: [],
};

const before =
  JSON.stringify(evidence);

new ExclusiveFeatureEngine()
  .analyze({
    differentialEvidenceResult:
      evidence,
  });

assert.equal(
  JSON.stringify(evidence),
  before,
);

console.log(
  "CI-002D.5 regression guard passed.",
);
