import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createMorphologyCandidateEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/generate-candidates/,
);

assert.match(
  source,
  /MORPHOLOGIC CANDIDATE GENERATOR/,
);

console.log(
  "CI-002C.4 server contract passed.",
);
