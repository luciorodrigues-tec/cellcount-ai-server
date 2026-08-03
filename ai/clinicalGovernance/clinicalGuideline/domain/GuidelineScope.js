export const GUIDELINE_SCOPE_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const GUIDELINE_SCOPE_TYPES = Object.freeze([
  "GLOBAL",
  "ORGANIZATION",
  "LABORATORY",
  "HOSPITAL",
  "DEPARTMENT",
  "WORKFLOW",
  "ENGINE",
  "RESEARCH",
  "CUSTOM",
]);

export function createGuidelineScope({
  type,
  targetId = null,
  metadata = {},
} = {}) {
  const normalizedType =
    String(type || "").trim().toUpperCase();

  if (!GUIDELINE_SCOPE_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported guideline scope type: ${normalizedType}`,
    );
  }

  if (
    normalizedType !== "GLOBAL" &&
    (!targetId || !String(targetId).trim())
  ) {
    throw new TypeError(
      "GuidelineScope.targetId is required for non-global scopes.",
    );
  }

  return Object.freeze({
    schemaVersion: GUIDELINE_SCOPE_SCHEMA_VERSION,
    type: normalizedType,
    targetId:
      normalizedType === "GLOBAL"
        ? null
        : String(targetId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
