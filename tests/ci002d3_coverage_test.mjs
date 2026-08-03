import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

import {
  DifferentialPairBuilder,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

import {
  buildObservedFeatureIndex,
  calculateDifferentialCoverage,
} from "../ai/differentialDiagnosis/similarityCalculator/index.js";

const library =
  createDifferentialRuleLibrary();

const builder =
  new DifferentialPairBuilder({
    ruleRepository:
      library.repository,
  });

const pair =
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
        normalizedScore: 0.8,
        marginFromWinner: 0.1,
      },
      alternatives: [],
    },
  }).eligiblePairs[0];

const empty =
  calculateDifferentialCoverage(
    pair,
    buildObservedFeatureIndex({}),
    0.15,
  );

const partial =
  calculateDifferentialCoverage(
    pair,
    buildObservedFeatureIndex({
      fine_chromatin: 1,
      visible_nucleoli: 1,
    }),
    0.15,
  );

assert.equal(
  empty.score,
  0,
);

assert.ok(
  partial.score > 0,
);

console.log(
  "CI-002D.3 coverage passed.",
);
