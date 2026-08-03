export const AUDIT_REVIEW_REFERENCE_SCHEMA_VERSION =
  "CGL-000001-S1-v1";

export function createAuditReviewReference({
  reviewId,
  reviewerId,
  status,
  reviewedAt = null,
  note = null,
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    reviewId,
    reviewerId,
    status,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `AuditReviewReference.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      AUDIT_REVIEW_REFERENCE_SCHEMA_VERSION,
    reviewId: String(reviewId).trim(),
    reviewerId: String(reviewerId).trim(),
    status: String(status).trim().toUpperCase(),
    reviewedAt:
      reviewedAt === null ? null : String(reviewedAt),
    note: note === null ? null : String(note).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
