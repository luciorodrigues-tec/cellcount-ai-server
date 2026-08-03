import assert from "node:assert/strict";

import {
  createDifferentialRuleLibrary,
  validateDifferentialRule,
} from "../ai/differentialDiagnosis/ruleLibrary/index.js";

const library =
  createDifferentialRuleLibrary();

for (
  const rule
  of library.repository.list()
) {
  const result =
    validateDifferentialRule(
      rule,
      {
        cellRegistry:
          library.cellRegistry,
        featureCatalog:
          library.featureCatalog,
      },
    );

  assert.equal(
    result.valid,
    true,
    `${rule.id}: ${result.errors.join(" ")}`,
  );
}

console.log(
  "CI-002D.1 validation passed.",
);
