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
  /createCriteriaEngineRegistry/,
);

assert.match(
  serverSource,
  /registerOperationalStatusRoutes/,
);

assert.match(
  routeSource,
  /\/knowledge\/morphology\/criteria\/status/,
);

assert.match(
  routeSource,
  /criteria_definition_ready/,
);

console.log(
  "CI-002C.1 server contract passed.",
);
