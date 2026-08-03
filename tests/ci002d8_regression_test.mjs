import assert from "node:assert/strict";
import {
  FinalDifferentialDiagnosisEngine,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const input = {
  specimenType: "PB",
  recommendations: [
    {
      recommendations: [
        {
          cell: "CELL-A",
          probability: 0.8,
          priorityScore: 0.9,
        },
      ],
    },
  ],
  conflictAnalysis: {},
};

const before =
  JSON.stringify(input);

new FinalDifferentialDiagnosisEngine()
  .analyze({
    recommendationAnalysis:
      input,
  });

assert.equal(
  JSON.stringify(input),
  before,
);
console.log(
  "CI-002D.8 regression guard passed.",
);
