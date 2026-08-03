import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const snapshot =
  library.repository.snapshot();

assert.equal(
  snapshot.size,
  12,
);

assert.ok(
  library.repository
    .getByPair(
      "CELL-BLAST",
      "CELL-PLASMABLAST",
    ),
);

assert.ok(
  library.repository
    .getByPair(
      "CELL-PLASMABLAST",
      "CELL-BLAST",
    ),
);

console.log(
  "CI-002D.1 library passed.",
);
