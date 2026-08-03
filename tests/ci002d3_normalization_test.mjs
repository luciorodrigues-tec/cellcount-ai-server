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
        normalizedScore: 1,
      },
      runnerUp: {
        cellId:
          "CELL-PLASMABLAST",
        normalizedScore: 1,
        marginFromWinner: 0,
      },
      alternatives: [],
    },
  }).eligiblePairs[0];

const result =
  new DifferentialSimilarityCalculator()
    .calculate({
      pair,
      specimenType:
        "BONE_MARROW_ASPIRATE",
      detectedFeatures: {
        fine_chromatin: 1,
        visible_nucleoli: 1,
        high_nc_ratio: 1,
      },
      confidenceResult: {
        score: 1,
        available: true,
        level: "VERY_HIGH",
      },
    });

assert.ok(
  result.finalSimilarity >= 0 &&
  result.finalSimilarity <= 1,
);

assert.ok(
  result.confidenceInterval.low >= 0 &&
  result.confidenceInterval.high <= 1,
);

console.log(
  "CI-002D.3 normalization passed.",
);
