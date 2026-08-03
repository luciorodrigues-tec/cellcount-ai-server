import assert from "node:assert/strict";

import {
  validateMorphologyKnowledgeEntity,
} from "../ai/knowledge/morphology/index.js";

const invalid =
  validateMorphologyKnowledgeEntity({
    id: "INVALID",
    displayName: "Inválido",
    version: "beta",
    specimenTypes: [],
    positiveCriteria: [],
    negativeCriteria: [],
    exclusionCriteria: [],
    limitationCriteria: [],
    minimumEvidence: {
      minimumPositiveCriteria: 1,
    },
    references: [],
  });

assert.equal(invalid.valid, false);
assert.ok(
  invalid.errors.some(
    (item) =>
      item.includes("semantic versioning"),
  ),
);

console.log(
  "CI-002A morphology validation passed.",
);
