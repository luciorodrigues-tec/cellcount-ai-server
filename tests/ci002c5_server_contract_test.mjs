import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyRankingEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/rank-candidates/,
);

assert.match(
  source,
  /MORPHOLOGIC RANKING ENGINE/,
);

console.log(
  "CI-002C.5 server contract passed.",
);
