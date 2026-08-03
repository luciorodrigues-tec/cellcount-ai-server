import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createDifferentialEvidenceEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/build-differential-evidence/,
);

assert.match(
  source,
  /DIFFERENTIAL EVIDENCE ENGINE/,
);

console.log(
  "CI-002D.4 server contract passed.",
);
