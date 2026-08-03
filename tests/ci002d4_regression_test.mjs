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

const features = {
  fine_chromatin: 1,
};

const similarity =
  new DifferentialSimilarityCalculator()
    .calculate({
      pair,
      detectedFeatures:
        features,
      confidenceResult: {
        score: 0.7,
        available: true,
      },
      specimenType:
        "BONE_MARROW_ASPIRATE",
    });

const beforeSimilarity =
  JSON.stringify(
    similarity,
  );

const beforeFeatures =
  JSON.stringify(
    features,
  );

new DifferentialEvidenceEngine()
  .analyze({
    similarityResult:
      similarity,
    detectedFeatures:
      features,
  });

assert.equal(
  JSON.stringify(
    similarity,
  ),
  beforeSimilarity,
);

assert.equal(
  JSON.stringify(
    features,
  ),
  beforeFeatures,
);

console.log(
  "CI-002D.4 regression guard passed.",
);
