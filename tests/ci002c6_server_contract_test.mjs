import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyConfidenceEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/calculate-confidence/,
);

assert.match(
  source,
  /MORPHOLOGIC CONFIDENCE ENGINE/,
);

console.log(
  "CI-002C.6 server contract passed.",
);
