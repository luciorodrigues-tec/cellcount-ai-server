import assert from "node:assert/strict";

import {
  createDifferentialEvidenceEngine,
} from "../ai/differentialDiagnosis/evidenceEngine/index.js";

const engine =
  createDifferentialEvidenceEngine({
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
  result.evidence.length,
  result.similarityAnalysis
    .similarities.length,
);

for (
  const item
  of result.evidence
) {
  assert.ok(
    item.summary,
  );
  assert.ok(
    item.statistics,
  );
}

console.log(
  "CI-002D.4 E2E evidence passed.",
);
