import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

import {
  DifferentialPairBuilder,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

import {
  DifferentialSimilarityCalculator,
} from "../ai/differentialDiagnosis/similarityCalculator/index.js";

const library =
  createDifferentialRuleLibrary();

const pair =
  new DifferentialPairBuilder({
    ruleRepository:
      library.repository,
  }).build({
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

const before =
  JSON.stringify(pair);

new DifferentialSimilarityCalculator()
  .calculate({
    pair,
    detectedFeatures: {
      fine_chromatin: 1,
    },
    confidenceResult: {
      score: 0.7,
      available: true,
    },
    specimenType:
      "BONE_MARROW_ASPIRATE",
  });

assert.equal(
  JSON.stringify(pair),
  before,
);

console.log(
  "CI-002D.3 regression guard passed.",
);
