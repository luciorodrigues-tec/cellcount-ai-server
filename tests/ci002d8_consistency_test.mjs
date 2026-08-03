import assert from "node:assert/strict";
import {
  checkFinalDiagnosisConsistency,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const result =
  checkFinalDiagnosisConsistency({
    primaryCell: "CELL-A",
    winner: {
      cellId: "CELL-A",
    },
    conflicts: [
      {
        primaryCell: "CELL-A",
        resolution: {
          winnerMaintained: true,
          finalCell: "CELL-A",
        },
        severity: {
          score: 0.1,
        },
      },
    ],
    recommendations: [
      {
        recommendations: [
          {
            cell: "CELL-A",
          },
        ],
      },
    ],
  });

assert.equal(
  result.agreementIndex,
  1,
);
assert.ok(
  result.overallConsistency > 0.9,
);
console.log(
  "CI-002D.8 consistency passed.",
);
