import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const run =
  spawnSync(
    process.execPath,
    [
      "engineering/scripts/validateFoundation.mjs",
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

console.log(
  "CCK-000.1 foundation validation passed.",
);
