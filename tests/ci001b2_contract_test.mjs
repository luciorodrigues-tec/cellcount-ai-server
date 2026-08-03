import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(
  new URL("./ci001b2_e2e.mjs", import.meta.url),
  "utf8",
);

assert.match(source, /\/classify-specimen/);
assert.match(source, /\/analyze-slide/);
assert.match(source, /specimenDecision/);
assert.match(source, /PERIPHERAL_BLOOD/);
assert.match(source, /BONE_MARROW_ASPIRATE/);
assert.match(source, /forbiddenMarrowPhrases/);
assert.match(source, /marrowAdequacy/);
assert.match(source, /specimenRouting/);

console.log(
  "CI-001B.2 contract test passed.",
);
