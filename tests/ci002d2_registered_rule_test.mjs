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
        cellId: "CELL-BLAST",
        rank: 1,
        score: 5,
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId:
          "CELL-PLASMABLAST",
        rank: 2,
        score: 4.8,
        normalizedScore: 0.85,
        marginFromWinner: 0.05,
      },
      alternatives: [],
      rejectedCandidates: [],
    },
  });

assert.equal(
  result.eligiblePairs.length,
  1,
);

assert.equal(
  result.eligiblePairs[0]
    .ruleId,
  "DIFF-CELL-BLAST-CELL-PLASMABLAST",
);

assert.equal(
  result.eligiblePairs[0]
    .registeredRule,
  true,
);

console.log(
  "CI-002D.2 registered rule lookup passed.",
);
