import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyScoringEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/score-features/,
);

assert.match(
  source,
  /MORPHOLOGIC SCORE CALCULATOR/,
);

console.log(
  "CI-002C.3 server contract passed.",
);
