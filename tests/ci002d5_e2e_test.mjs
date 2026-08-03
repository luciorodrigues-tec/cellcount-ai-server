import assert from "node:assert/strict";
import {
  createExclusiveFeatureEngine,
} from "../ai/differentialDiagnosis/exclusiveFeatureEngine/index.js";

const engine =
  createExclusiveFeatureEngine({
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
  result.exclusiveFeatures.length,
  result.evidenceAnalysis
    .evidence.length,
);

for (
  const item
  of result.exclusiveFeatures
) {
  assert.ok(item.summary);
}

console.log(
  "CI-002D.5 E2E passed.",
);
