export function validateClinicalDecisionRequest(
  request,
  policy,
) {
  const errors = [];
  const warnings = [];

  if (!request?.requestId) {
    errors.push("requestId is required.");
  }

  if (request?.input === undefined) {
    errors.push("input is required.");
  }

  if (
    Array.isArray(request?.images) &&
    request.images.length > policy.maximumImages
  ) {
    errors.push(
      `A maximum of ${policy.maximumImages} images is allowed.`,
    );
  }

  if (
    !policy.allowEmptyImages &&
    (!Array.isArray(request?.images) ||
      request.images.length === 0)
  ) {
    errors.push("At least one image is required.");
  }

  if (
    policy.requireManualCountsObject &&
    (
      request?.manualCounts === null ||
      typeof request?.manualCounts !== "object"
    )
  ) {
    errors.push(
      "manualCounts must be provided as an object.",
    );
  }

  if (
    request?.images?.length === 0
  ) {
    warnings.push(
      "No images were provided; image-based stages may be skipped.",
    );
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
