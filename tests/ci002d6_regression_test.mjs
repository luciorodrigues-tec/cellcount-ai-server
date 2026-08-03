import assert from "node:assert/strict";
import {
  DiagnosticConflictEngine,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const input = {
  pairId: "PAIR-A-B",
  pair: {
    primaryNormalizedScore: 0.8,
    alternativeNormalizedScore: 0.7,
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
  ],
};

const before =
  JSON.stringify(input);

new DiagnosticConflictEngine()
  .analyze({
    exclusiveFeatureResult:
      input,
  });

assert.equal(
  JSON.stringify(input),
  before,
);

console.log(
  "CI-002D.6 regression guard passed.",
);
