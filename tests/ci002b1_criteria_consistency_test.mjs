import assert from "node:assert/strict";

import {
  cellKnowledgeLibrary,
  validateMorphologyKnowledgeEntity,
} from "../ai/knowledge/morphology/index.js";

for (const entity of cellKnowledgeLibrary) {
  const validation =
    validateMorphologyKnowledgeEntity(
      entity,
    );

  assert.equal(
    validation.valid,
    true,
    `${entity.id}: ${validation.errors.join(" ")}`,
  );

  const weightedMaximum =
    entity.positiveCriteria.reduce(
      (sum, criterion) =>
        sum + criterion.weight,
      0,
    );

  assert.ok(
    entity.minimumEvidence
      .minimumWeightedScore <=
      weightedMaximum,
    `${entity.id} minimumWeightedScore exceeds available evidence.`,
  );
}

console.log(
  "CI-002B.1 criteria consistency passed.",
);
