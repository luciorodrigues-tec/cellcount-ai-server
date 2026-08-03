export const HEMATOLOGIC_SYNDROME_SCHEMA_VERSION =
  "CRR-000027-v1";

export const HEMATOLOGIC_SYNDROME_TYPES =
  Object.freeze([
    "CYTOPENIA",
    "CYTOSIS",
    "HEMOLYSIS",
    "MARROW_FAILURE",
    "BLASTIC",
    "DYSPLASTIC",
    "LYMPHOPROLIFERATIVE",
    "MYELOPROLIFERATIVE",
    "PLASMACYTIC",
    "REACTIVE",
    "COAGULOPATHIC",
    "COMPOSITE",
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

export function createHematologicSyndrome({
  id,
  preferredName,
  type,
  requiredPatternIds = [],
  supportivePatternIds = [],
  exclusionPatternIds = [],
  requiredFeatureIds = [],
  supportiveFeatureIds = [],
  exclusionFeatureIds = [],
  minimumRequiredPatterns = null,
  minimumSupportivePatterns = 0,
  minimumScore = 0,
  relatedDiseaseIds = [],
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
        `HematologicSyndrome.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  if (!HEMATOLOGIC_SYNDROME_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported hematologic syndrome type: ${normalizedType}`,
    );
  }

  const requiredPatterns = uniqueStrings(requiredPatternIds);
  const supportivePatterns = uniqueStrings(supportivePatternIds);
  const exclusionPatterns = uniqueStrings(exclusionPatternIds);

  const minRequired =
    minimumRequiredPatterns === null
      ? requiredPatterns.length
      : Number(minimumRequiredPatterns);

  if (
    !Number.isInteger(minRequired) ||
    minRequired < 0 ||
    minRequired > requiredPatterns.length
  ) {
    throw new TypeError(
      "HematologicSyndrome.minimumRequiredPatterns is invalid.",
    );
  }

  const minSupportive = Number(minimumSupportivePatterns);
  if (
    !Number.isInteger(minSupportive) ||
    minSupportive < 0 ||
    minSupportive > supportivePatterns.length
  ) {
    throw new TypeError(
      "HematologicSyndrome.minimumSupportivePatterns is invalid.",
    );
  }

  const minScore = Number(minimumScore);
  if (!Number.isFinite(minScore) || minScore < 0 || minScore > 1) {
    throw new TypeError(
      "HematologicSyndrome.minimumScore must be between 0 and 1.",
    );
  }

  return Object.freeze({
    schemaVersion:
      HEMATOLOGIC_SYNDROME_SCHEMA_VERSION,
    id: String(id).trim(),
    preferredName: String(preferredName).trim(),
    type: normalizedType,
    requiredPatternIds: requiredPatterns,
    supportivePatternIds: supportivePatterns,
    exclusionPatternIds: exclusionPatterns,
    requiredFeatureIds: uniqueStrings(requiredFeatureIds),
    supportiveFeatureIds: uniqueStrings(supportiveFeatureIds),
    exclusionFeatureIds: uniqueStrings(exclusionFeatureIds),
    minimumRequiredPatterns: minRequired,
    minimumSupportivePatterns: minSupportive,
    minimumScore: minScore,
    relatedDiseaseIds: uniqueStrings(relatedDiseaseIds),
    evidenceSourceIds: uniqueStrings(evidenceSourceIds),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
