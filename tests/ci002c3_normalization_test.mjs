import assert from "node:assert/strict";

import {
  createMorphologyScoringEngine,
} from "../ai/scoring/morphologyScore/index.js";

const engine =
  createMorphologyScoringEngine();

const result =
  engine.score(
    {
      "Cromatina delicada": 1,
      "Nucléolos visíveis": 1,
      "Alta relação núcleo citoplasma": 1,
    },
    {
      specimenType:
        "BONE_MARROW_ASPIRATE",
    },
  );

const blast =
  result.scores.find(
    (item) =>
      item.cellId ===
      "CELL-BLAST",
  );

assert.ok(blast);
assert.ok(
  blast.normalizedScore >= 0 &&
  blast.normalizedScore <= 1,
);

console.log(
  "CI-002C.3 normalization passed.",
);
