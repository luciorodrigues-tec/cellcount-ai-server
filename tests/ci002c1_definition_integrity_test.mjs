import assert from "node:assert/strict";

import {
  cellCriteriaDefinitions,
} from "../ai/knowledge/morphology/index.js";

assert.equal(
  cellCriteriaDefinitions.length,
  15,
);

const ids =
  cellCriteriaDefinitions.map(
    (definition) =>
      definition.id,
  );

const cellIds =
  cellCriteriaDefinitions.map(
    (definition) =>
      definition.cellId,
  );

assert.equal(
  new Set(ids).size,
  ids.length,
);

assert.equal(
  new Set(cellIds).size,
  cellIds.length,
);

for (
  const definition
  of cellCriteriaDefinitions
) {
  assert.ok(
    definition.required.length +
    definition.supportive.length >= 1,
    `${definition.cellId} has no positive rules.`,
  );

  assert.ok(
    definition.thresholds
      .minimumWeightedScore > 0,
  );
}

console.log(
  "CI-002C.1 definition integrity passed.",
);
