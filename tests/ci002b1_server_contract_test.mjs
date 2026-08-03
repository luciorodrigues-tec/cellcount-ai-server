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
  /createCellKnowledgeRegistry/,
);

assert.match(
  serverSource,
  /registerOperationalStatusRoutes/,
);

assert.match(
  routeSource,
  /\/knowledge\/morphology\/status/,
);

assert.match(
  routeSource,
  /cell_library_ready/,
);

console.log(
  "CI-002B.1 server contract passed.",
);
