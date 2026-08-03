import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createDiagnosticConflictEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/analyze-diagnostic-conflicts/,
);

assert.match(
  source,
  /DIAGNOSTIC CONFLICT ENGINE/,
);

console.log(
  "CI-002D.6 server contract passed.",
);
