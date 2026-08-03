import { createHash } from "node:crypto";

function normalize(value) {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = normalize(value[key]);
        return result;
      }, {});
  }

  return value;
}

export function stableFingerprint(value) {
  const normalized = JSON.stringify(normalize(value));
  return createHash("sha256")
    .update(normalized)
    .digest("hex");
}

export function readPath(value, path) {
  if (!path) {
    return null;
  }

  const parts = String(path)
    .split(".")
    .filter(Boolean);

  let current = value;

  for (const part of parts) {
    current = current?.[part];
  }

  return current ?? null;
}

export function cloneAuditValue(value) {
  if (value === undefined) {
    return null;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}
