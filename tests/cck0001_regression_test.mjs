import fs from "node:fs";
import assert from "node:assert/strict";

const serverBefore =
  fs.readFileSync(
    "server.js",
    "utf8",
  );

assert.match(
  serverBefore,
  /FINAL DIFFERENTIAL DIAGNOSIS ENGINE/,
);

assert.doesNotMatch(
  serverBefore,
  /CCK-000\.1/,
);

console.log(
  "CCK-000.1 backend regression guard passed.",
);
