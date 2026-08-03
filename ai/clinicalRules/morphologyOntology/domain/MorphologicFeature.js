export const MORPHOLOGIC_FEATURE_SCHEMA_VERSION =
  "CRR-000018-v1";

export const MORPHOLOGIC_FEATURE_CATEGORIES =
  Object.freeze([
    "ERYTHROCYTE",
    "LEUKOCYTE",
    "PLATELET",
    "BONE_MARROW",
    "GENERAL",
    "ARTIFACT",
    "OTHER",
  ]);

export const MORPHOLOGIC_LINEAGES =
  Object.freeze([
    "ERYTHROID",
    "MYELOID",
    "LYMPHOID",
    "MEGAKARYOCYTIC",
    "PLASMACYTIC",
    "MULTILINEAGE",
    "UNSPECIFIED",
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

export function createMorphologicFeature({
  id,
  preferredName,
  category,
  lineage = "UNSPECIFIED",
  synonyms = [],
  aliases = [],
  parentFeatureId = null,
  severity = "INFO",
  localization = "UNSPECIFIED",
  description = "",
  referenceIds = [],
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    preferredName,
    category,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MorphologicFeature.${field} is required.`,
      );
    }
  }

  const normalizedCategory = String(category)
    .trim()
    .toUpperCase();

  if (
    !MORPHOLOGIC_FEATURE_CATEGORIES.includes(
      normalizedCategory,
    )
  ) {
    throw new TypeError(
      `Unsupported morphologic feature category: ${normalizedCategory}`,
    );
  }

  const normalizedLineage = String(lineage)
    .trim()
    .toUpperCase();

  if (
    !MORPHOLOGIC_LINEAGES.includes(
      normalizedLineage,
    )
  ) {
    throw new TypeError(
      `Unsupported morphologic lineage: ${normalizedLineage}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      MORPHOLOGIC_FEATURE_SCHEMA_VERSION,
    id: String(id).trim(),
    preferredName: String(preferredName).trim(),
    category: normalizedCategory,
    lineage: normalizedLineage,
    synonyms: uniqueStrings(synonyms),
    aliases: uniqueStrings(aliases),
    parentFeatureId:
      parentFeatureId === null
        ? null
        : String(parentFeatureId).trim(),
    severity: String(severity).trim().toUpperCase(),
    localization:
      String(localization).trim().toUpperCase(),
    description: String(description || "").trim(),
    referenceIds: uniqueStrings(referenceIds),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
