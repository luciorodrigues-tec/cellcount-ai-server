export const CLINICAL_RULE_SCHEMA_VERSION = "CRR-000001-v1";

const SEMVER_PATTERN =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function uniqueStrings(values = []) {
  return Object.freeze([
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]);
}

function freezeReferences(values = []) {
  return Object.freeze(
    (Array.isArray(values) ? values : []).map((reference) =>
      Object.freeze({
        ...(reference && typeof reference === "object"
          ? reference
          : { citation: String(reference ?? "") }),
      }),
    ),
  );
}

export function createClinicalRule({
  id,
  version = "1.0.0",
  title,
  description = "",
  category,
  severity = "info",
  specimenTypes = [],
  tags = [],
  evidenceLevel = "UNSPECIFIED",
  references = [],
  active = true,
  applies,
  apply,
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError("ClinicalRule.id is required.");
  }

  if (!SEMVER_PATTERN.test(String(version))) {
    throw new TypeError(
      "ClinicalRule.version must use semantic versioning.",
    );
  }

  if (!title || !String(title).trim()) {
    throw new TypeError("ClinicalRule.title is required.");
  }

  if (!category || !String(category).trim()) {
    throw new TypeError("ClinicalRule.category is required.");
  }

  if (typeof applies !== "function") {
    throw new TypeError("ClinicalRule.applies must be a function.");
  }

  if (typeof apply !== "function") {
    throw new TypeError("ClinicalRule.apply must be a function.");
  }

  return Object.freeze({
    schemaVersion: CLINICAL_RULE_SCHEMA_VERSION,
    id: String(id).trim(),
    version: String(version).trim(),
    title: String(title).trim(),
    description: String(description).trim(),
    category: String(category).trim().toUpperCase(),
    severity: String(severity).trim().toLowerCase(),
    specimenTypes: uniqueStrings(specimenTypes),
    tags: uniqueStrings(tags),
    evidenceLevel: String(evidenceLevel).trim().toUpperCase(),
    references: freezeReferences(references),
    active: Boolean(active),
    applies,
    apply,
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object" ? metadata : {}),
    }),
  });
}
