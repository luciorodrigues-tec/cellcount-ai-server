import assert from "node:assert/strict";

import {
  cellCriteriaDefinitions,
} from "../ai/knowledge/morphology/index.js";

for (
  const definition
  of cellCriteriaDefinitions
) {
  const positiveWeight = [
    ...definition.required,
    ...definition.supportive,
  ].reduce(
    (sum, rule) =>
      sum + rule.weight,
    0,
  );

  assert.ok(
    definition.thresholds
      .minimumWeightedScore <=
      positiveWeight,
    definition.cellId,
  );

  assert.ok(
    definition.thresholds
      .minimumRequiredMatches <=
      definition.required.length,
    definition.cellId,
  );
}

console.log(
  "CI-002C.1 weights passed.",
);
