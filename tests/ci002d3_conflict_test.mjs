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
        normalizedScore: 0.85,
        marginFromWinner: 0.05,
      },
      alternatives: [],
    },
  }).eligiblePairs[0];

const calculator =
  new DifferentialSimilarityCalculator();

const clean =
  calculator.calculate({
    pair,
    specimenType:
      "BONE_MARROW_ASPIRATE",
    detectedFeatures: {
      fine_chromatin: 1,
      visible_nucleoli: 1,
      high_nc_ratio: 1,
      scant_cytoplasm: 1,
    },
    confidenceResult: {
      score: 0.9,
      available: true,
      level: "VERY_HIGH",
    },
  });

const conflicted =
  calculator.calculate({
    pair,
    specimenType:
      "BONE_MARROW_ASPIRATE",
    detectedFeatures: {
      fine_chromatin: 1,
      visible_nucleoli: 1,
      high_nc_ratio: 1,
      eccentric_nucleus: 1,
      perinuclear_hof: 1,
      abundant_basophilic_cytoplasm: 1,
    },
    confidenceResult: {
      score: 0.9,
      available: true,
      level: "VERY_HIGH",
    },
  });

assert.ok(
  conflicted
    .featureConflict
    .conflict > 0,
);

assert.ok(
  clean.finalSimilarity >
  conflicted.finalSimilarity,
);

console.log(
  "CI-002D.3 conflict handling passed.",
);
