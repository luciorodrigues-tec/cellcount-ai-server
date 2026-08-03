import fs from "node:fs";
import assert from "node:assert/strict";

import * as core
  from "../kernel/core/index.js";

const contract =
  JSON.parse(
    fs.readFileSync(
      "kernel/core/contracts/core-contract.json",
      "utf8",
    ),
  );

assert.equal(
  core.MODULE_ID,
  "CCK-001.1",
);

assert.equal(
  core.MODULE_VERSION,
  "CCK-001.1-v1",
);

for (
  const name
  of contract.publicExports
) {
  assert.ok(
    Object.hasOwn(core, name),
    name,
  );
}

assert.deepEqual(
  contract.runtime
    .externalDependencies,
  [],
);

console.log(
  "CCK-001.1 public contract passed.",
);
