import fs from "node:fs";
import assert from "node:assert/strict";

const source =
  fs.readFileSync(
    new URL("../server.js", import.meta.url),
    "utf8",
  );

assert.match(
  source,
  /createDifferentialRecommendationEngine/,
);

assert.match(
  source,
  /\/knowledge\/morphology\/recommend-differential/,
);

assert.match(
  source,
  /DIFFERENTIAL RECOMMENDATION ENGINE/,
);

console.log(
  "CI-002D.7 server contract passed.",
);
