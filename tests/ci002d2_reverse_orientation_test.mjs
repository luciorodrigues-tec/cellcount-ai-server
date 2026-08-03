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
          "CELL-PLASMABLAST",
        rank: 1,
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId:
          "CELL-BLAST",
        rank: 2,
        normalizedScore: 0.85,
        marginFromWinner: 0.05,
      },
      alternatives: [],
    },
  });

assert.equal(
  result.eligiblePairs.length,
  1,
);

assert.equal(
  result.eligiblePairs[0]
    .reverseOrientation,
  true,
);

console.log(
  "CI-002D.2 reverse orientation passed.",
);
