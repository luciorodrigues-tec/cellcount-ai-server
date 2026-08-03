import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createDifferentialPairBuilderEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/build-differential-pairs/,
);

assert.match(
  source,
  /DIFFERENTIAL PAIR BUILDER/,
);

console.log(
  "CI-002D.2 server contract passed.",
);
