export const PROVENANCE_CANONICALIZER_VERSION =
  "CGL-000002-S2-v1.0.0";

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

export class ProvenanceCanonicalizer {
  canonicalize(value) {
    return JSON.stringify(normalize(value));
  }
}
