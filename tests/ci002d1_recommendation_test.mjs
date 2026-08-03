import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const tests =
  library.repository
    .findRecommendations(
      "CELL-BLAST",
      "CELL-PLASMABLAST",
    );

assert.ok(
  tests.length >= 2,
);

assert.ok(
  tests.some(
    (item) =>
      item.id ===
      "FLOW_CYTOMETRY",
  ),
);

console.log(
  "CI-002D.1 recommendations passed.",
);
