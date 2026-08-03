export const KNOWLEDGE_SOURCE_MANIFEST_SCHEMA_VERSION =
  "CRR-000016-v1";

export function createKnowledgeSourceManifest({
  sourceId,
  title,
  publisher,
  publicationYear,
  classificationFamily,
  version,
  sourceType = "OFFICIAL_CLASSIFICATION",
  uri = null,
  checksum = null,
  reviewedBy = [],
  approvalStatus = "DRAFT",
  notes = "",
} = {}) {
  for (const [field, value] of Object.entries({
    sourceId,
    title,
    publisher,
    publicationYear,
    classificationFamily,
    version,
  })) {
    if (
      value === undefined ||
      value === null ||
      !String(value).trim()
    ) {
      throw new TypeError(
        `KnowledgeSourceManifest.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      KNOWLEDGE_SOURCE_MANIFEST_SCHEMA_VERSION,
    sourceId: String(sourceId).trim(),
    title: String(title).trim(),
    publisher: String(publisher).trim(),
    publicationYear: Number(publicationYear),
    classificationFamily:
      String(classificationFamily).trim().toUpperCase(),
    version: String(version).trim(),
    sourceType:
      String(sourceType).trim().toUpperCase(),
    uri:
      uri === null ? null : String(uri).trim(),
    checksum:
      checksum === null
        ? null
        : String(checksum).trim(),
    reviewedBy: Object.freeze([
      ...(Array.isArray(reviewedBy)
        ? reviewedBy.map(String)
        : []),
    ]),
    approvalStatus:
      String(approvalStatus).trim().toUpperCase(),
    notes: String(notes || "").trim(),
  });
}
