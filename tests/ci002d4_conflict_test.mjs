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
  visible_nucleoli: 1,
  high_nc_ratio: 1,
  scant_cytoplasm: 1,
  eccentric_nucleus: 1,
  perinuclear_hof: 1,
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
  result.conflictEvidence.length >
  0,
);

assert.ok(
  result.conflictEvidence.every(
    (item) =>
      item.conflicting === true,
  ),
);

console.log(
  "CI-002D.4 conflict evidence passed.",
);
