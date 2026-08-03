import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root =
  path.resolve(
    path.dirname(
      fileURLToPath(import.meta.url),
    ),
    "..",
  );

const required = [
  "README.md.tpl",
  "SPEC.md.tpl",
  "ARCHITECTURE.md.tpl",
  "CHANGELOG.md.tpl",
  "index.js.tpl",
  "contract_test.mjs.tpl",
];

for (const file of required) {
  assert.equal(
    fs.existsSync(
      path.join(
        root,
        "engineering/templates/module",
        file,
      ),
    ),
    true,
    file,
  );
}

console.log(
  "CCK-000.1 template contract passed.",
);
