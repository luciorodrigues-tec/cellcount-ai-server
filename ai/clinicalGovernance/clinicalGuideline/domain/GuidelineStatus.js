export const GUIDELINE_STATUS_VERSION =
  "CGL-000004-S1-v1.0.0";

export const GUIDELINE_STATUSES = Object.freeze([
  "DRAFT",
  "ACTIVE",
  "SUSPENDED",
  "RETIRED",
]);

export function assertGuidelineStatus(value) {
  const normalized =
    String(value || "").trim().toUpperCase();

  if (!GUIDELINE_STATUSES.includes(normalized)) {
    throw new TypeError(
      `Unsupported guideline status: ${normalized}`,
    );
  }

  return normalized;
}
