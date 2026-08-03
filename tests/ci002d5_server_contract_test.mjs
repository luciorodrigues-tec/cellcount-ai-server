import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createExclusiveFeatureEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/analyze-exclusive-features/,
);

assert.match(
  source,
  /EXCLUSIVE FEATURE ENGINE/,
);

console.log(
  "CI-002D.5 server contract passed.",
);
