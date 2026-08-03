import assert from "node:assert/strict";

import {
  DifferentialPairBuilder,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const builder =
  new DifferentialPairBuilder({
    ruleRepository:
      library.repository,
  });

const result =
  builder.build({
    specimenType:
      "BONE_MARROW_ASPIRATE",
    explanation: {
      winner: {
        cellId:
          "CELL-LYMPHOCYTE",
        rank: 1,
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId:
          "CELL-REACTIVE-LYMPHOCYTE",
        rank: 2,
        normalizedScore: 0.8,
        marginFromWinner: 0.1,
      },
      alternatives: [],
    },
  });

assert.equal(
  result.eligiblePairs.length,
  0,
);

assert.ok(
  result.rejectedPairs[0]
    .rejectionReasons
    .includes(
      "SPECIMEN_INCOMPATIBLE",
    ),
);

console.log(
  "CI-002D.2 specimen compatibility passed.",
);
