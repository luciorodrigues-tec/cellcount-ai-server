import assert from "node:assert/strict";

import {
  cellKnowledgeLibrary,
} from "../ai/knowledge/morphology/index.js";

const aliasOwner =
  new Map();

for (const entity of cellKnowledgeLibrary) {
  for (const alias of entity.aliases) {
    const key =
      alias.trim().toLowerCase();

    if (!key) continue;

    const previous =
      aliasOwner.get(key);

    assert.ok(
      !previous ||
      previous === entity.id,
      `Alias duplicated across entities: ${alias}`,
    );

    aliasOwner.set(
      key,
      entity.id,
    );
  }
}

console.log(
  "CI-002B.1 alias integrity passed.",
);
