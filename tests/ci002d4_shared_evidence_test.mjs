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
        normalizedScore: 0.85,
        marginFromWinner: 0.05,
      },
      alternatives: [],
    },
  }).eligiblePairs[0];

const features = {
  fine_chromatin: 1,
  visible_nucleoli: 0.8,
  high_nc_ratio: 0.7,
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

assert.equal(
  result.sharedEvidence.length,
  3,
);

assert.ok(
  result.sharedEvidence
    .every(
      (item) =>
        item.favors === "BOTH",
    ),
);

console.log(
  "CI-002D.4 shared evidence passed.",
);
