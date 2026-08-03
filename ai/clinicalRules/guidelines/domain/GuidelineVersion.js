export const GUIDELINE_SCHEMA_VERSION =
  "CRR-000005-v1";

export const GUIDELINE_STATUSES = Object.freeze([
  "DRAFT",
  "ACTIVE",
  "DEPRECATED",
  "SUPERSEDED",
  "RETIRED",
]);

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

function nullableString(value) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

export function createGuidelineVersion({
  id,
  family,
  version,
  title,
  status = "DRAFT",
  publicationDate = null,
  effectiveFrom = null,
  effectiveUntil = null,
  jurisdiction = "GLOBAL",
  specimenTypes = [],
  supersedes = null,
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
        `GuidelineVersion.${field} is required.`,
      );
    }
  }

  if (!SEMVER_PATTERN.test(String(version))) {
    throw new TypeError(
      "GuidelineVersion.version must use semantic versioning.",
    );
  }

  const normalizedStatus = String(status)
    .trim()
    .toUpperCase();

  if (!GUIDELINE_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported guideline status: ${normalizedStatus}`,
    );
  }

  return Object.freeze({
    schemaVersion: GUIDELINE_SCHEMA_VERSION,
    id: String(id).trim(),
    family: String(family).trim().toUpperCase(),
    version: String(version).trim(),
    title: String(title).trim(),
    status: normalizedStatus,
    publicationDate: nullableString(publicationDate),
    effectiveFrom: nullableString(effectiveFrom),
    effectiveUntil: nullableString(effectiveUntil),
    jurisdiction: String(jurisdiction)
      .trim()
      .toUpperCase(),
    specimenTypes: uniqueStrings(specimenTypes),
    supersedes: nullableString(supersedes),
    sourceIds: uniqueStrings(sourceIds),
    notes: String(notes || "").trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
