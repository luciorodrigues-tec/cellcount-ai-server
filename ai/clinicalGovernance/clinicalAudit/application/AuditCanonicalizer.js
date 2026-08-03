export const AUDIT_CANONICALIZER_VERSION =
  "CGL-000001-S2-v1.0.0";

function canonicalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = canonicalizeValue(value[key]);
        return result;
      }, {});
  }

  return value;
}

export class AuditCanonicalizer {
  canonicalize(value) {
    return JSON.stringify(canonicalizeValue(value));
  }
}
