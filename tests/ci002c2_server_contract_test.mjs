import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createFeatureMatcher/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/match-features/,
);

assert.match(
  source,
  /MORPHOLOGIC FEATURE MATCHER/,
);

console.log(
  "CI-002C.2 server contract passed.",
);
