import assert from "node:assert/strict";
import {
  createDiagnosticConflictEngine,
} from "../ai/differentialDiagnosis/conflictEngine/index.js";

const engine =
  createDiagnosticConflictEngine({
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
  result.conflicts.length,
  result.exclusiveAnalysis
    .exclusiveFeatures.length,
);

for (const item of result.conflicts) {
  assert.ok(item.severity);
  assert.ok(item.probabilities);
  assert.ok(item.resolution);
}

console.log(
  "CI-002D.6 E2E passed.",
);
