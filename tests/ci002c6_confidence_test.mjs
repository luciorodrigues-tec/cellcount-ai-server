import assert from "node:assert/strict";

import {
  createMorphologyConfidenceEngine,
} from "../ai/confidence/morphologyConfidence/index.js";

const engine =
  createMorphologyConfidenceEngine();

const result =
  engine.analyze(
    {
      fine_chromatin: 1,
      visible_nucleoli: 1,
      high_nc_ratio: 1,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(
  result.confidence.score >= 0 &&
  result.confidence.score <= 1,
);

assert.ok(
  [
    "VERY_HIGH",
    "HIGH",
    "MODERATE",
    "LOW",
    "VERY_LOW",
  ].includes(
    result.confidence.level,
  ),
);

assert.equal(
  result.confidence
    .rankingPreserved,
  true,
);

console.log(
  "CI-002C.6 confidence passed.",
);
