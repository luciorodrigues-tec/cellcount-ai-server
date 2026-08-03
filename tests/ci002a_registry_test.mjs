import assert from "node:assert/strict";

import {
  createFoundationMorphologyRegistry,
} from "../ai/knowledge/morphology/index.js";

const registry =
  createFoundationMorphologyRegistry();

assert.equal(registry.snapshot().size, 3);
assert.ok(registry.get("CELL-BLAST"));
assert.ok(
  registry.search("plasmócito").length >= 1,
);
assert.ok(
  registry.list({
    specimenType:
      "PERIPHERAL_BLOOD",
  }).length >= 3,
);

assert.throws(
  () =>
    registry.register(
      registry.get("CELL-BLAST"),
    ),
  /already registered/,
);

console.log(
  "CI-002A morphology registry passed.",
);
