import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here =
  path.dirname(
    fileURLToPath(import.meta.url),
  );

export function loadEngineeringConfig() {
  const configPath =
    path.resolve(
      here,
      "../engineering.config.json",
    );

  return JSON.parse(
    fs.readFileSync(
      configPath,
      "utf8",
    ),
  );
}
