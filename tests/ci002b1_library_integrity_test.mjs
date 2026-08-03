import assert from "node:assert/strict";

import {
  cellKnowledgeLibrary,
} from "../ai/knowledge/morphology/index.js";

assert.equal(
  cellKnowledgeLibrary.length,
  15,
);

const ids =
  cellKnowledgeLibrary.map(
    (entity) => entity.id,
  );

assert.equal(
  new Set(ids).size,
  ids.length,
);

for (const entity of cellKnowledgeLibrary) {
  assert.equal(
    entity.status,
    "validated",
  );

  assert.ok(
    entity.positiveCriteria.length >= 1,
    `${entity.id} has no positive criteria.`,
  );

  assert.ok(
    entity.references.length >= 1,
    `${entity.id} has no references.`,
  );

  assert.ok(
    entity.specimenTypes.length >= 1,
    `${entity.id} has no specimen types.`,
  );
}

console.log(
  "CI-002B.1 library integrity passed.",
);
