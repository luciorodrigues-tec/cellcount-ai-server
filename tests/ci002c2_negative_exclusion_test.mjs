import assert from "node:assert/strict";

import {
  createFeatureMatcher,
} from "../ai/matching/featureMatcher/index.js";

const engine =
  createFeatureMatcher();

const results =
  engine.matcher.match(
    {
      segmented_nucleus: 0.95,
      specific_mature_granules: 0.90,
    },
    {
      specimenType:
        "PERIPHERAL_BLOOD",
    },
  );

const blast =
  results.find(
    (item) =>
      item.cellId ===
      "CELL-BLAST",
  );

assert.ok(blast);
assert.ok(
  blast.negativeMatched >= 1 ||
  blast.exclusionMatched >= 1,
);

console.log(
  "CI-002C.2 negative/exclusion passed.",
);
