import assert from "node:assert/strict";
import {
  aggregateFinalDiagnosisInput,
  mergeFinalDiagnosisPolicy,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const aggregate =
  aggregateFinalDiagnosisInput(
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
      recommendations: [
        {
          recommendations: [
            {
              cell: "CELL-A",
              probability: 0.8,
              priorityScore: 0.9,
            },
            {
              cell: "CELL-B",
              probability: 0.2,
              priorityScore: 0.3,
            },
          ],
        },
      ],
      conflictAnalysis: {},
    },
    mergeFinalDiagnosisPolicy(),
  );

assert.equal(
  aggregate.primaryCell,
  "CELL-A",
);
assert.equal(
  aggregate.alternatives[0].cell,
  "CELL-B",
);
console.log(
  "CI-002D.8 aggregation passed.",
);
