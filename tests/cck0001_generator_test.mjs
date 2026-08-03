import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root =
  path.resolve(
    path.dirname(
      fileURLToPath(import.meta.url),
    ),
    "..",
  );

const relative =
  `tmp-cck0001-${Date.now()}`;

const target =
  path.join(root, relative);

const run =
  spawnSync(
    process.execPath,
    [
      "engineering/scripts/generateModule.mjs",
      "CCK-TEST",
      "Generated Test Module",
      relative,
    ],
    {
      cwd: root,
      encoding: "utf8",
    },
  );

try {
  assert.equal(
    run.status,
    0,
    run.stderr,
  );

  for (
    const item
    of [
      "README.md",
      "SPEC.md",
      "ARCHITECTURE.md",
      "CHANGELOG.md",
      "index.js",
      "src",
      "tests",
      "contracts",
      "examples",
    ]
  ) {
    assert.equal(
      fs.existsSync(
        path.join(target, item),
      ),
      true,
      item,
    );
  }

  const source =
    fs.readFileSync(
      path.join(target, "index.js"),
      "utf8",
    );

  assert.match(
    source,
    /CCK-TEST/,
  );
} finally {
  fs.rmSync(
    target,
    {
      recursive: true,
      force: true,
    },
  );
}

console.log(
  "CCK-000.1 module generator passed.",
);
