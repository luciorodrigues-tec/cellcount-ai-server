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
    policy: {
      minimumAlternativeNormalizedScore:
        0.70,
      maximumMarginFromWinner:
        0.20,
    },
  });

const result =
  builder.build({
    specimenType:
      "BONE_MARROW_ASPIRATE",
    explanation: {
      winner: {
        cellId: "CELL-BLAST",
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId:
          "CELL-PLASMABLAST",
        normalizedScore: 0.5,
        marginFromWinner: 0.4,
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
      "ALTERNATIVE_BELOW_MINIMUM_NORMALIZED_SCORE",
    ),
);

assert.ok(
  result.rejectedPairs[0]
    .rejectionReasons
    .includes(
      "MARGIN_FROM_WINNER_TOO_LARGE",
    ),
);

console.log(
  "CI-002D.2 thresholds passed.",
);
