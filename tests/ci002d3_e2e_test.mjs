import assert from "node:assert/strict";

import {
  createDifferentialSimilarityEngine,
} from "../ai/differentialDiagnosis/similarityCalculator/index.js";

const engine =
  createDifferentialSimilarityEngine({
    pairPolicy: {
      includeRejectedCandidates: true,
      minimumAlternativeNormalizedScore: 0,
      maximumMarginFromWinner: 1,
      maxAlternatives: 15,
    },
  });

const result =
  engine.analyze(
    {
      fine_chromatin: 1,
      visible_nucleoli: 1,
      high_nc_ratio: 1,
      eccentric_nucleus: 0.6,
      perinuclear_hof: 0.6,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.equal(
  result.similarities.length,
  result.pairAnalysis
    .pairs
    .eligiblePairs
    .length,
);

for (
  const similarity
  of result.similarities
) {
  assert.ok(
    similarity.finalSimilarity >= 0 &&
    similarity.finalSimilarity <= 1,
  );
}

console.log(
  "CI-002D.3 E2E similarity passed.",
);
