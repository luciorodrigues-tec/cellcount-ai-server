export const QUALITY_CATEGORY_VERSION =
  "CGL-000005-S1-v1.0.0";

export const QUALITY_CATEGORIES = Object.freeze([
  "CLINICAL",
  "AI",
  "PERFORMANCE",
  "OPERATIONAL",
  "COMPLIANCE",
  "SAFETY",
]);

export function assertQualityCategory(value) {
  const normalized =
    String(value || "").trim().toUpperCase();

  if (!QUALITY_CATEGORIES.includes(normalized)) {
    throw new TypeError(
      `Unsupported quality category: ${normalized}`,
    );
  }

  return normalized;
}
