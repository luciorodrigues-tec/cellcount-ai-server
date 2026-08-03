export const DIAGNOSTIC_CLASSIFICATION_SCHEMA_VERSION =
  "CRR-000015-v1";

export const DIAGNOSTIC_CLASSIFICATION_FAMILIES =
  Object.freeze([
    "WHO",
    "ICC",
    "ELN",
    "FAB",
    "NCCN",
    "LOCAL",
    "OTHER",
  ]);

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

export function createDiagnosticClassification({
  id,
  family,
  version,
  title,
  publicationYear = null,
  effectiveFrom = null,
  effectiveUntil = null,
  status = "DRAFT",
  sourceIds = [],
  notes = "",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    family,
    version,
    title,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticClassification.${field} is required.`,
      );
    }
  }

  const normalizedFamily = String(family)
    .trim()
    .toUpperCase();

  if (
    !DIAGNOSTIC_CLASSIFICATION_FAMILIES.includes(
      normalizedFamily,
    )
  ) {
    throw new TypeError(
      `Unsupported classification family: ${normalizedFamily}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      DIAGNOSTIC_CLASSIFICATION_SCHEMA_VERSION,
    id: String(id).trim(),
    family: normalizedFamily,
    version: String(version).trim(),
    title: String(title).trim(),
    publicationYear:
      publicationYear === null
        ? null
        : Number(publicationYear),
    effectiveFrom:
      effectiveFrom === null
        ? null
        : String(effectiveFrom),
    effectiveUntil:
      effectiveUntil === null
        ? null
        : String(effectiveUntil),
    status: String(status).trim().toUpperCase(),
    sourceIds: uniqueStrings(sourceIds),
    notes: String(notes || "").trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
