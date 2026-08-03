import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(
  new URL("../server.js", import.meta.url),
  "utf8",
);

assert.match(source, /"\/classify-specimen"/);
assert.match(source, /validateSpecimenGate/);
assert.match(source, /specimenDecision/);
assert.match(source, /BONE_MARROW_ASPIRATE/);
assert.match(source, /HEMODILUTED_BONE_MARROW/);
assert.match(source, /applyBoneMarrowLanguageGuard/);
assert.match(source, /analysisType === "bone_marrow"/);

console.log("CI-001B smoke test passed.");
