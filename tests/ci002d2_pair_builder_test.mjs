import assert from "node:assert/strict";

import {
  createDifferentialPairBuilderEngine,
} from "../ai/differentialDiagnosis/pairBuilder/index.js";

const engine =
  createDifferentialPairBuilderEngine({
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
      eccentric_nucleus: 0.7,
      perinuclear_hof: 0.7,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(
  result.pairs
    .statistics
    .evaluated >= 1,
);

assert.ok(
  result.pairs
    .pairs.every(
      (pair) =>
        pair.primaryCell ===
        result.pairs
          .winner
          .cellId,
    ),
);

assert.equal(
  result.pairs
    .statistics
    .evaluated,
  result.pairs.pairs.length,
);

console.log(
  "CI-002D.2 pair builder passed.",
);
