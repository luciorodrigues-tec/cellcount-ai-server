import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root =
  path.resolve(
    path.dirname(
      fileURLToPath(import.meta.url),
    ),
    "../..",
  );

function walk(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const output = [];

  for (
    const entry
    of fs.readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    )
  ) {
    const absolute =
      path.join(directory, entry.name);

    if (entry.isDirectory()) {
      output.push(
        ...walk(absolute),
      );
    } else if (
      entry.name.endsWith("_test.mjs")
    ) {
      output.push(absolute);
    }
  }

  return output;
}

const tests =
  walk(
    path.join(root, "tests"),
  ).sort();

const failures = [];

for (const file of tests) {
  const run =
    spawnSync(
      process.execPath,
      [file],
      {
        cwd: root,
        encoding: "utf8",
      },
    );

  if (run.stdout) {
    process.stdout.write(
      run.stdout,
    );
  }

  if (run.status !== 0) {
    failures.push({
      file:
        path.relative(root, file),
      stderr:
        run.stderr,
    });
  }
}

if (failures.length) {
  console.error(
    JSON.stringify(
      failures,
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  `Enterprise test runner passed: ${tests.length} tests.`,
);
