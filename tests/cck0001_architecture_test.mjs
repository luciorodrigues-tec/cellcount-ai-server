import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run =
  spawnSync(
    process.execPath,
    [
      "engineering/scripts/checkArchitecture.mjs",
    ],
    {
      encoding: "utf8",
    },
  );

assert.equal(
  run.status,
  0,
  run.stderr,
);

assert.match(
  run.stdout,
  /architecture rules passed/i,
);

console.log(
  "CCK-000.1 architecture enforcement passed.",
);
