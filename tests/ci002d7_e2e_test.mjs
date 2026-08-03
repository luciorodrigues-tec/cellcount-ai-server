import assert from "node:assert/strict";
import {
  createDifferentialRecommendationEngine,
} from "../ai/differentialDiagnosis/recommendationEngine/index.js";

const engine =
  createDifferentialRecommendationEngine({
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
      scant_cytoplasm: 0.9,
      eccentric_nucleus: 0.8,
      perinuclear_hof: 0.8,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.equal(
  result.recommendations.length,
  result.conflictAnalysis
    .conflicts.length,
);

for (const item of result.recommendations) {
  assert.equal(
    item.safetyValidation.safe,
    true,
  );
}

console.log(
  "CI-002D.7 E2E passed.",
);
