import assert from "node:assert/strict";

import {
  createMorphologyExplanationEngine,
} from "../ai/explanation/morphologyExplanation/index.js";

const engine =
  createMorphologyExplanationEngine();

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
  result.explanation.winner,
);

assert.ok(
  result.explanation
    .narrative
    .headline.length > 0,
);

assert.ok(
  result.explanation
    .evidence
    .supportingEvidence
    .length >= 1,
);

assert.equal(
  result.explanation
    .rankingPreserved,
  true,
);

assert.equal(
  result.explanation
    .confidencePreserved,
  true,
);

console.log(
  "CI-002C.7 explanation passed.",
);
