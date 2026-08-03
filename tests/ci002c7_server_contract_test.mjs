import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyExplanationEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/explain-decision/,
);

assert.match(
  source,
  /MORPHOLOGIC EXPLANATION ENGINE/,
);

console.log(
  "CI-002C.7 server contract passed.",
);
