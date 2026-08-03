import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadEngineeringConfig,
} from "./engineeringConfig.js";

const root =
  path.resolve(
    path.dirname(
      fileURLToPath(import.meta.url),
    ),
    "../..",
  );

const config =
  loadEngineeringConfig();

const required = [
  "engineering/engineering.config.json",
  "engineering/standards/CODE_STANDARD.md",
  "engineering/standards/TEST_STANDARD.md",
  "engineering/standards/DOCUMENTATION_STANDARD.md",
  "engineering/standards/RELEASE_STANDARD.md",
  "engineering/templates/module/README.md.tpl",
  "engineering/templates/module/SPEC.md.tpl",
  "engineering/templates/module/ARCHITECTURE.md.tpl",
  "engineering/templates/module/CHANGELOG.md.tpl",
  "engineering/templates/module/index.js.tpl",
  "engineering/templates/module/contract_test.mjs.tpl",
  "engineering/scripts/generateModule.mjs",
  "engineering/scripts/checkArchitecture.mjs",
  "engineering/scripts/runEnterpriseTests.mjs"
];

const missing =
  required.filter(
    (item) =>
      !fs.existsSync(
        path.join(root, item),
      ),
  );

if (missing.length) {
  throw new Error(
    `Missing engineering foundation files: ${missing.join(", ")}`,
  );
}

if (
  config.foundationVersion !==
  "CCK-000.1-v1"
) {
  throw new Error(
    "Unexpected engineering foundation version.",
  );
}

console.log(
  "CCK-000.1 engineering foundation validation passed.",
);
