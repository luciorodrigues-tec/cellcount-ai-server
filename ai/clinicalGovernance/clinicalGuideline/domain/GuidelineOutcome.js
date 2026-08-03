export const GUIDELINE_OUTCOME_SCHEMA_VERSION =
  "CGL-000004-S1-v1";

export const GUIDELINE_OUTCOME_TYPES = Object.freeze([
  "COMPLETE",
  "ESCALATE",
  "REFER",
  "CONTINUE",
  "STOP",
]);

export function createGuidelineOutcome({
  outcomeId,
  type,
  label,
  nextGuidelineId = null,
  metadata = {},
} = {}) {
  if (!outcomeId || !type || !label) {
    throw new TypeError(
      "GuidelineOutcome requires outcomeId, type and label.",
    );
  }

  const normalizedType =
    String(type).trim().toUpperCase();

  if (!GUIDELINE_OUTCOME_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported guideline outcome type: ${normalizedType}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_OUTCOME_SCHEMA_VERSION,
    outcomeId: String(outcomeId).trim(),
    type: normalizedType,
    label: String(label).trim(),
    nextGuidelineId:
      nextGuidelineId === null
        ? null
        : String(nextGuidelineId).trim(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
