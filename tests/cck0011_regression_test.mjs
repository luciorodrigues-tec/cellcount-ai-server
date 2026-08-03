import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
let projectRoot = path.dirname(currentFile);

while (
  !fs.existsSync(path.join(projectRoot, "server.js")) ||
  !fs.existsSync(path.join(projectRoot, "package.json"))
) {
  const parent = path.dirname(projectRoot);

  if (parent === projectRoot) {
    throw new Error("Project root not found.");
  }

  projectRoot = parent;
}

const serverFile = path.join(projectRoot, "server.js");
const baselineFile = path.join(
  projectRoot,
  "tests",
  "fixtures",
  "cck0011_regression_guard_v2.json",
);

const updateBaseline =
  process.env.UPDATE_REGRESSION_GUARD === "1";

const requiredSignatures = Object.freeze([
  ["hospital_prompt", /\bconst\s+hospitalPrompt\s*=\s*`/],
  [
    "final_differential_engine_import",
    /\bcreateFinalDifferentialDiagnosisEngine\b/,
  ],
  [
    "final_differential_engine_bootstrap",
    /\bconst\s+finalDifferentialDiagnosisEngine\s*=/,
  ],
  ["final_clinical_governor", /\bapplyFinalClinicalGovernor\b/],
  ["consistency_validation", /\bvalidateConsistency\b/],
  ["clinical_safety_governor", /\bapplyClinicalSafetyGovernor\b/],
  ["hematology_safety_engine", /\bvalidateHematologyAnalysis\b/],
  ["hematology_consensus_engine", /\bbuildHematologyConsensus\b/],
  [
    "final_differential_engine_log",
    /\bFINAL DIFFERENTIAL DIAGNOSIS ENGINE\b/,
  ],
]);

const forbiddenPromptFragments = Object.freeze([
  "RAW GPT RESPONSE",
  "Running 'npm start'",
  "Your service is live",
  "==> Deploying...",
]);

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

function normalize(value) {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^[ \t]*\/\/.*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function extractTemplateLiteral(source, variableName) {
  const marker = `const ${variableName} = \``;
  const start = source.indexOf(marker);

  assert.notEqual(
    start,
    -1,
    `${variableName} assignment was not found.`,
  );

  let escaped = false;

  for (
    let index = start + marker.length;
    index < source.length;
    index += 1
  ) {
    const character = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\") {
      escaped = true;
      continue;
    }

    if (
      character === "`" &&
      source[index + 1] === ";"
    ) {
      return source.slice(
        start + marker.length,
        index,
      );
    }
  }

  throw new Error(
    `${variableName} closing delimiter was not found.`,
  );
}

assert.ok(
  fs.existsSync(serverFile),
  `server.js was not found at ${serverFile}.`,
);

const source = fs.readFileSync(serverFile, "utf8");

assert.ok(
  source.length > 0,
  "server.js must not be empty.",
);

const hospitalPrompt =
  extractTemplateLiteral(source, "hospitalPrompt");

for (const fragment of forbiddenPromptFragments) {
  assert.equal(
    hospitalPrompt.includes(fragment),
    false,
    `hospitalPrompt contains forbidden fragment: ${fragment}`,
  );
}

const signatures = requiredSignatures.map(
  ([id, pattern]) => {
    const match = pattern.exec(source);

    assert.ok(
      match,
      `Required backend signature is missing: ${id}.`,
    );

    return {
      id,
      matchedText: match[0],
    };
  },
);

const signaturePayload = signatures
  .map(({ id, matchedText }) => `${id}:${matchedText}`)
  .join("\n");

const current = {
  schemaVersion: 2,
  serverFile: "server.js",
  promptLength: hospitalPrompt.length,
  promptHash: sha256(normalize(hospitalPrompt)),
  signatureHash: sha256(signaturePayload),
  normalizedServerHash: sha256(normalize(source)),
  signatureIds: signatures.map(({ id }) => id),
};

if (updateBaseline) {
  fs.mkdirSync(
    path.dirname(baselineFile),
    { recursive: true },
  );

  fs.writeFileSync(
    baselineFile,
    `${JSON.stringify(current, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `CCK-001.1 Regression Guard v2 baseline updated: ${baselineFile}`,
  );

  process.exit(0);
}

assert.ok(
  fs.existsSync(baselineFile),
  [
    "Regression Guard v2 baseline was not found.",
    `Expected: ${baselineFile}`,
    "After reviewing intentional changes, run:",
    "set UPDATE_REGRESSION_GUARD=1",
    "node --test tests\\cck0011_regression_test.mjs",
    "set UPDATE_REGRESSION_GUARD=",
  ].join("\n"),
);

const baseline = JSON.parse(
  fs.readFileSync(baselineFile, "utf8"),
);

assert.equal(
  baseline.schemaVersion,
  2,
  "Unsupported regression baseline schema.",
);

assert.deepEqual(
  current.signatureIds,
  baseline.signatureIds,
  "The protected clinical signature set changed.",
);

assert.equal(
  current.promptHash,
  baseline.promptHash,
  [
    "hospitalPrompt regression detected.",
    `Expected: ${baseline.promptHash}`,
    `Received: ${current.promptHash}`,
    `Current prompt length: ${current.promptLength}`,
  ].join("\n"),
);

assert.equal(
  current.signatureHash,
  baseline.signatureHash,
  "Protected backend signatures changed.",
);

assert.equal(
  current.normalizedServerHash,
  baseline.normalizedServerHash,
  [
    "Normalized backend regression detected.",
    `Expected: ${baseline.normalizedServerHash}`,
    `Received: ${current.normalizedServerHash}`,
    "Comments and line-ending differences are ignored.",
  ].join("\n"),
);

console.log(
  "CCK-001.1 Regression Guard v2 passed.",
);
