export const MORPHOLOGIC_PATTERN_SCHEMA_VERSION =
  "CRR-000026-v1";

export const MORPHOLOGIC_PATTERN_TYPES =
  Object.freeze([
    "CELLULAR",
    "LINEAGE",
    "CYTOPLASMIC",
    "NUCLEAR",
    "ARCHITECTURAL",
    "POPULATION",
    "COMPOSITE",
    "ARTIFACT",
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

function freezeWeightedFeatures(values = []) {
  return Object.freeze(
    (Array.isArray(values) ? values : []).map(
      (item) => {
        if (!item || typeof item !== "object") {
          throw new TypeError(
            "MorphologicPattern.weightedFeatures requires objects.",
          );
        }

        const featureId = String(item.featureId || "").trim();
        const weight = Number(item.weight ?? 1);

        if (!featureId) {
          throw new TypeError(
            "MorphologicPattern.weightedFeatures.featureId is required.",
          );
        }

        if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
          throw new TypeError(
            "MorphologicPattern.weightedFeatures.weight must be between 0 and 1.",
          );
        }

        return Object.freeze({
          featureId,
          weight,
          required: Boolean(item.required),
        });
      },
    ),
  );
}

export function createMorphologicPattern({
  id,
  preferredName,
  type,
  requiredFeatureIds = [],
  supportiveFeatureIds = [],
  exclusionFeatureIds = [],
  weightedFeatures = [],
  minimumRequiredMatches = null,
  minimumSupportiveMatches = 0,
  minimumScore = 0,
  parentPatternId = null,
  aliases = [],
  evidenceSourceIds = [],
  version = "1.0.0",
  status = "DRAFT",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    preferredName,
    type,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `MorphologicPattern.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();

  if (!MORPHOLOGIC_PATTERN_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported morphologic pattern type: ${normalizedType}`,
    );
  }

  const required = uniqueStrings(requiredFeatureIds);
  const supportive = uniqueStrings(supportiveFeatureIds);
  const exclusions = uniqueStrings(exclusionFeatureIds);
  const normalizedMinimumRequired =
    minimumRequiredMatches === null
      ? required.length
      : Number(minimumRequiredMatches);

  if (
    !Number.isInteger(normalizedMinimumRequired) ||
    normalizedMinimumRequired < 0 ||
    normalizedMinimumRequired > required.length
  ) {
    throw new TypeError(
      "MorphologicPattern.minimumRequiredMatches is invalid.",
    );
  }

  const normalizedMinimumSupportive =
    Number(minimumSupportiveMatches);

  if (
    !Number.isInteger(normalizedMinimumSupportive) ||
    normalizedMinimumSupportive < 0 ||
    normalizedMinimumSupportive > supportive.length
  ) {
    throw new TypeError(
      "MorphologicPattern.minimumSupportiveMatches is invalid.",
    );
  }

  const normalizedMinimumScore = Number(minimumScore);

  if (
    !Number.isFinite(normalizedMinimumScore) ||
    normalizedMinimumScore < 0 ||
    normalizedMinimumScore > 1
  ) {
    throw new TypeError(
      "MorphologicPattern.minimumScore must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      MORPHOLOGIC_PATTERN_SCHEMA_VERSION,
    id: String(id).trim(),
    preferredName: String(preferredName).trim(),
    type: normalizedType,
    requiredFeatureIds: required,
    supportiveFeatureIds: supportive,
    exclusionFeatureIds: exclusions,
    weightedFeatures:
      freezeWeightedFeatures(weightedFeatures),
    minimumRequiredMatches:
      normalizedMinimumRequired,
    minimumSupportiveMatches:
      normalizedMinimumSupportive,
    minimumScore: normalizedMinimumScore,
    parentPatternId:
      parentPatternId === null
        ? null
        : String(parentPatternId).trim(),
    aliases: uniqueStrings(aliases),
    evidenceSourceIds:
      uniqueStrings(evidenceSourceIds),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
