import assert from "node:assert/strict";

import {
  loadEngineeringConfig,
} from "../engineering/scripts/engineeringConfig.js";

const config =
  loadEngineeringConfig();

assert.equal(
  config.foundationVersion,
  "CCK-000.1-v1",
);

assert.equal(
  config.runtime.moduleSystem,
  "ESM",
);

assert.ok(
  config.requiredModuleDocuments
    .includes("SPEC.md"),
);

console.log(
  "CCK-000.1 configuration passed.",
);
