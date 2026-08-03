import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createDifferentialSimilarityEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/calculate-differential-similarity/,
);

assert.match(
  source,
  /DIFFERENTIAL SIMILARITY CALCULATOR/,
);

console.log(
  "CI-002D.3 server contract passed.",
);
