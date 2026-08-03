export const GUIDELINE_RULE_BINDING_SCHEMA_VERSION =
  "CRR-000005-v1";

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

export function createGuidelineRuleBinding({
  guidelineId,
  guidelineVersion,
  ruleId,
  ruleVersion,
  status = "ACTIVE",
  rationale = "",
  migratedFrom = null,
  changeTypes = [],
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    guidelineId,
    guidelineVersion,
    ruleId,
    ruleVersion,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `GuidelineRuleBinding.${field} is required.`,
      );
    }
  }

  return Object.freeze({
    schemaVersion:
      GUIDELINE_RULE_BINDING_SCHEMA_VERSION,
    guidelineId: String(guidelineId).trim(),
    guidelineVersion:
      String(guidelineVersion).trim(),
    ruleId: String(ruleId).trim(),
    ruleVersion: String(ruleVersion).trim(),
    status: String(status).trim().toUpperCase(),
    rationale: String(rationale || "").trim(),
    migratedFrom:
      migratedFrom === null
        ? null
        : String(migratedFrom).trim(),
    changeTypes: uniqueStrings(
      changeTypes.map((value) =>
        String(value).toUpperCase(),
      ),
    ),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
