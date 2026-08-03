import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

const similar =
  library.repository
    .findSimilar(0.80);

assert.ok(
  similar.length >= 5,
);

for (
  let index = 1;
  index < similar.length;
  index += 1
) {
  assert.ok(
    similar[index - 1]
      .similarity >=
    similar[index]
      .similarity,
  );
}

console.log(
  "CI-002D.1 similarity lookup passed.",
);
