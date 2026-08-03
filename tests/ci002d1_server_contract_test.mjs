import fs from "node:fs";
import assert from "node:assert/strict";

const serverSource = fs.readFileSync(
  new URL("../server.js", import.meta.url),
  "utf8",
);

const routeSource = fs.readFileSync(
  new URL(
    "../routes/operationalStatusRoutes.js",
    import.meta.url,
  ),
  "utf8",
);

assert.match(
  serverSource,
  /createDifferentialRuleLibrary/,
);

assert.match(
  serverSource,
  /DIFFERENTIAL RULE LIBRARY/,
);

assert.match(
  serverSource,
  /registerOperationalStatusRoutes/,
);

assert.match(
  routeSource,
  /\/knowledge\/morphology\/differential-rules\/status/,
);

assert.match(
  routeSource,
  /differential_rule_library_ready/,
);

assert.match(
  routeSource,
  /pairCount:\s*snapshot\.size/,
);

console.log(
  "CI-002D.1 server contract passed.",
);