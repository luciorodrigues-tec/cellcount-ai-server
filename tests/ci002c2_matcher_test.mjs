import assert from "node:assert/strict";

import {
  createFeatureMatcher,
} from "../ai/matching/featureMatcher/index.js";

const engine =
  createFeatureMatcher();

const results =
  engine.matcher.match(
    {
      "Cromatina delicada": 0.94,
      "Nucléolos visíveis": 0.88,
      "Alta relação núcleo citoplasma": 0.90,
      "Campo limitado": 1,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(results.length >= 10);

const blast =
  results.find(
    (item) =>
      item.cellId ===
      "CELL-BLAST",
  );

assert.ok(blast);
assert.equal(
  blast.requiredMatched,
  blast.requiredTotal,
);

assert.ok(
  blast.coverage
    .overallCoverage > 0.5,
);

assert.ok(
  blast.limitationMatched >= 1,
);

console.log(
  "CI-002C.2 matcher passed.",
);
