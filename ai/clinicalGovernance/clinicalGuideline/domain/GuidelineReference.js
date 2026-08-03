export const GUIDELINE_REFERENCE_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export function createGuidelineReference({
  referenceId,
  organization,
  title,
  version = null,
  publishedAt = null,
  doi = null,
  url = null,
  evidenceLevel = null,
} = {}) {
  if (!referenceId || !organization || !title) {
    throw new TypeError(
      "GuidelineReference requires referenceId, organization and title.",
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_REFERENCE_SCHEMA_VERSION,
    referenceId: String(referenceId).trim(),
    organization: String(organization).trim(),
    title: String(title).trim(),
    version:
      version === null ? null : String(version).trim(),
    publishedAt:
      publishedAt === null ? null : String(publishedAt),
    doi: doi === null ? null : String(doi).trim(),
    url: url === null ? null : String(url).trim(),
    evidenceLevel,
  });
}
