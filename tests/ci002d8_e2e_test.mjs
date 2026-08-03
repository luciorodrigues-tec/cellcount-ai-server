import assert from "node:assert/strict";
import {
  createFinalDifferentialDiagnosisEngine,
} from "../ai/differentialDiagnosis/finalDiagnosisEngine/index.js";

const engine =
  createFinalDifferentialDiagnosisEngine({
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

assert.ok(
  result.primaryDiagnosis,
);
assert.ok(
  result.overallConfidence >= 0 &&
  result.overallConfidence <= 1,
);
assert.ok(
  result.overallConsistency >= 0 &&
  result.overallConsistency <= 1,
);
assert.equal(
  result.safetyValidation.safe,
  true,
);
console.log(
  "CI-002D.8 E2E passed.",
);
