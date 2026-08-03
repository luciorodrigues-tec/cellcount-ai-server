import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createFinalDifferentialDiagnosisEngine/,
);
assert.match(
  source,
  /\/knowledge\/morphology\/final-differential/,
);
assert.match(
  source,
  /FINAL DIFFERENTIAL DIAGNOSIS ENGINE/,
);
console.log(
  "CI-002D.8 server contract passed.",
);
