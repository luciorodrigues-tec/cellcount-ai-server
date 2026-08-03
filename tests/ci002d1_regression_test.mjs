import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const first =
  JSON.stringify(
    library.repository
      .snapshot(),
  );

const second =
  JSON.stringify(
    library.repository
      .snapshot(),
  );

assert.equal(
  first,
  second,
);

console.log(
  "CI-002D.1 regression guard passed.",
);
