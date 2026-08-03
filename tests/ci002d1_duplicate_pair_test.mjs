import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const rule =
  library.repository
    .getByPair(
      "CELL-BLAST",
      "CELL-PLASMABLAST",
    );

assert.throws(
  () =>
    library.repository
      .register({
        ...rule,
        id:
          "DUPLICATE-PAIR",
      }),
  /pair already registered/,
);

console.log(
  "CI-002D.1 duplicate pair protection passed.",
);
