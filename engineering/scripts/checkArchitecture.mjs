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
      path.join(
        directory,
        entry.name,
      );

    if (entry.isDirectory()) {
      output.push(
        ...walk(absolute),
      );
    } else if (
      entry.name.endsWith(".js") ||
      entry.name.endsWith(".mjs")
    ) {
      output.push(absolute);
    }
  }

  return output;
}

const violations = [];

for (
  const rule
  of config.architecture
    .forbiddenImports
) {
  const sourceRoot =
    path.join(
      root,
      rule.from,
    );

  for (
    const file
    of walk(sourceRoot)
  ) {
    const text =
      fs.readFileSync(
        file,
        "utf8",
      );

    const patterns = [
      `/${rule.to}/`,
      `../${rule.to}/`,
      `../../${rule.to}/`,
    ];

    if (
      patterns.some(
        (pattern) =>
          text.includes(pattern),
      )
    ) {
      violations.push({
        file:
          path.relative(root, file),
        rule,
      });
    }
  }
}

const kernelRoot =
  path.join(
    root,
    "kernel",
  );

for (
  const file
  of walk(kernelRoot)
) {
  const text =
    fs.readFileSync(
      file,
      "utf8",
    ).toLowerCase();

  for (
    const term
    of config.architecture
      .forbiddenTermsInKernel
  ) {
    if (text.includes(term)) {
      violations.push({
        file:
          path.relative(root, file),
        rule: {
          reason:
            `Forbidden domain term in Kernel: ${term}`,
        },
      });
    }
  }
}

if (violations.length) {
  console.error(
    JSON.stringify(
      violations,
      null,
      2,
    ),
  );
  process.exit(1);
}

console.log(
  "CCK-000.1 architecture rules passed.",
);
