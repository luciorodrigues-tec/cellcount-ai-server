import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args =
  process.argv.slice(2);

const [moduleId, moduleTitle, destination] =
  args;

if (
  !moduleId ||
  !moduleTitle ||
  !destination
) {
  console.error(
    'Usage: node engineering/scripts/generateModule.mjs "CCK-001" "Kernel Foundation" "kernel/cck001"',
  );
  process.exit(2);
}

const root =
  path.resolve(
    path.dirname(
      fileURLToPath(import.meta.url),
    ),
    "../..",
  );

const target =
  path.resolve(root, destination);

if (fs.existsSync(target)) {
  throw new Error(
    `Target already exists: ${target}`,
  );
}

const replacements = {
  "{{MODULE_ID}}":
    moduleId,
  "{{MODULE_ID_LOWER}}":
    moduleId
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, ""),
  "{{MODULE_TITLE}}":
    moduleTitle,
  "{{MODULE_VERSION}}":
    `${moduleId}-v1`,
  "{{MODULE_DESCRIPTION}}":
    `${moduleTitle} enterprise module.`,
};

function render(text) {
  let output = text;

  for (
    const [token, value]
    of Object.entries(replacements)
  ) {
    output =
      output.replaceAll(
        token,
        value,
      );
  }

  return output;
}

const templateRoot =
  path.join(
    root,
    "engineering/templates/module",
  );

fs.mkdirSync(target, {
  recursive: true,
});

for (
  const directory
  of [
    "src",
    "tests",
    "contracts",
    "examples",
  ]
) {
  fs.mkdirSync(
    path.join(target, directory),
    {
      recursive: true,
    },
  );
}

const mappings = [
  ["README.md.tpl", "README.md"],
  ["SPEC.md.tpl", "SPEC.md"],
  ["ARCHITECTURE.md.tpl", "ARCHITECTURE.md"],
  ["CHANGELOG.md.tpl", "CHANGELOG.md"],
  ["index.js.tpl", "index.js"],
  [
    "contract_test.mjs.tpl",
    `tests/${replacements["{{MODULE_ID_LOWER}}"]}_contract_test.mjs`,
  ],
];

for (
  const [source, destinationFile]
  of mappings
) {
  const input =
    fs.readFileSync(
      path.join(
        templateRoot,
        source,
      ),
      "utf8",
    );

  fs.writeFileSync(
    path.join(
      target,
      destinationFile,
    ),
    render(input),
    "utf8",
  );
}

console.log(
  `Generated ${moduleId} at ${path.relative(root, target)}`,
);
