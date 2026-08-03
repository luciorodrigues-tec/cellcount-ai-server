import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyEvidenceGraphEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/build-evidence-graph/,
);

assert.match(
  source,
  /MORPHOLOGIC EVIDENCE GRAPH/,
);

console.log(
  "CI-002C.8 server contract passed.",
);
