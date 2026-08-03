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
      "PERIPHERAL_BLOOD",
    explanation: {
      winner: {
        cellId: "CELL-BASOPHIL",
        rank: 1,
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId: "CELL-EOSINOPHIL",
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
      "RULE_NOT_REGISTERED",
    ),
);

console.log(
  "CI-002D.2 unregistered pair handling passed.",
);
