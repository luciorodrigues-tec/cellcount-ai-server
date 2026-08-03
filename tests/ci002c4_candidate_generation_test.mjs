import assert from "node:assert/strict";

import {
  createMorphologyCandidateEngine,
} from "../ai/candidate/morphologyCandidate/index.js";

const engine =
  createMorphologyCandidateEngine();

const result =
  engine.generate(
    {
      fine_chromatin: 0.95,
      visible_nucleoli: 0.9,
      high_nc_ratio: 0.92,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

assert.ok(
  result.candidates
    .eligible.length >= 1,
);

const blast =
  result.candidates
    .eligible
    .find(
      (item) =>
        item.cellId ===
        "CELL-BLAST",
    );

assert.ok(blast);
assert.equal(
  blast.eligible,
  true,
);
assert.equal(
  blast.status,
  "ELIGIBLE",
);

console.log(
  "CI-002C.4 candidate generation passed.",
);
