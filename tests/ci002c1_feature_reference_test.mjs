import assert from "node:assert/strict";

import {
  createCriteriaEngineRegistry,
} from "../ai/knowledge/morphology/index.js";

const engine =
  createCriteriaEngineRegistry();

for (
  const definition
  of engine.criteriaRegistry
    .snapshot().definitions
) {
  const rules = [
    ...definition.required,
    ...definition.supportive,
    ...definition.negative,
    ...definition.exclusion,
    ...definition.limitation,
  ];

  for (const rule of rules) {
    assert.equal(
      engine.featureCatalog
        .has(rule.featureId),
      true,
      `${definition.cellId}: unknown feature ${rule.featureId}`,
    );
  }
}

console.log(
  "CI-002C.1 feature references passed.",
);
