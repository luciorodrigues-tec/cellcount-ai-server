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

const similarity =
  new DifferentialSimilarityCalculator()
    .calculate({
      pair,
      detectedFeatures: {},
      confidenceResult: {
        score: 0.5,
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
      detectedFeatures: {},
    });

assert.ok(
  result.missingEvidence.length >
  0,
);

assert.ok(
  result.missingEvidence.every(
    (item) =>
      item.missing === true,
  ),
);

console.log(
  "CI-002D.4 missing evidence passed.",
);
