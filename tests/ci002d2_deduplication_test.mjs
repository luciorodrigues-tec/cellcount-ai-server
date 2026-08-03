import assert from "node:assert/strict";

import {
  collectDifferentialAlternatives,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

const alternatives =
  collectDifferentialAlternatives(
    {
      runnerUp: {
        cellId:
          "CELL-PLASMABLAST",
      },
      alternatives: [
        {
          cellId:
            "CELL-PLASMABLAST",
        },
        {
          cellId:
            "CELL-PROMYELOCYTE",
        },
      ],
    },
    {
      includeRunnerUp: true,
      includeRankedAlternatives: true,
      includeRejectedCandidates: false,
      maxAlternatives: 5,
    },
  );

assert.deepEqual(
  alternatives.map(
    (item) =>
      item.cellId,
  ),
  [
    "CELL-PLASMABLAST",
    "CELL-PROMYELOCYTE",
  ],
);

console.log(
  "CI-002D.2 alternative deduplication passed.",
);
