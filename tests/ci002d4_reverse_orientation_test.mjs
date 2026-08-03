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

import {
  DifferentialEvidenceEngine,
} from "../ai/differentialDiagnosis/evidenceEngine/index.js";

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
        cellId:
          "CELL-PLASMABLAST",
        normalizedScore: 0.9,
      },
      runnerUp: {
        cellId:
          "CELL-BLAST",
        normalizedScore: 0.85,
        marginFromWinner: 0.05,
      },
      alternatives: [],
    },
  }).eligiblePairs[0];

const features = {
  eccentric_nucleus: 1,
  perinuclear_hof: 1,
  abundant_basophilic_cytoplasm: 1,
};

const similarity =
  new DifferentialSimilarityCalculator()
    .calculate({
      pair,
      detectedFeatures:
        features,
      confidenceResult: {
        score: 0.8,
        available: true,
      },
      specimenType:
        "BONE_MARROW_ASPIRATE",
    });

const result =
  new DifferentialEvidenceEngine()
    .analyze({
      similarityResult:
        similarity,
      detectedFeatures:
        features,
    });

assert.ok(
  result.winnerEvidence.some(
    (item) =>
      item.featureId ===
      "eccentric_nucleus",
  ),
);

console.log(
  "CI-002D.4 reverse orientation passed.",
);
