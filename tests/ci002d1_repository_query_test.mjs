import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

assert.ok(
  library.repository
    .getByCell(
      "CELL-BLAST",
    )
    .length >= 4,
);

assert.ok(
  library.repository
    .getByPrimaryCell(
      "CELL-BLAST",
    )
    .length >= 4,
);

assert.ok(
  library.repository
    .getByDifferentialCell(
      "CELL-PLASMABLAST",
    )
    .length >= 2,
);

console.log(
  "CI-002D.1 repository queries passed.",
);
