export const DIAGNOSTIC_RECOMMENDATION_SCHEMA_VERSION =
  "CRR-000022-v1";

export const DIAGNOSTIC_RECOMMENDATION_TYPES =
  Object.freeze([
    "CLINICAL_CORRELATION",
    "LABORATORY_CORRELATION",
    "CONFIRMATORY_TEST",
    "SPECIALIST_REVIEW",
    "REPEAT_ANALYSIS",
    "URGENT_REVIEW",
    "SAFETY_ALERT",
    "EDUCATIONAL_NOTE",
    "OTHER",
  ]);

export const DIAGNOSTIC_RECOMMENDATION_PRIORITIES =
  Object.freeze([
    "ROUTINE",
    "PRIORITY",
    "URGENT",
    "CRITICAL",
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

export function createDiagnosticRecommendation({
  id,
  hypothesisId = null,
  type,
  priority = "ROUTINE",
  title,
  rationale,
  action,
  triggerStatuses = [],
  requiredSourceTypes = [],
  evidenceSourceIds = [],
  blocksAutomation = false,
  requiresHumanReview = false,
  version = "1.0.0",
  status = "ACTIVE",
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    id,
    type,
    title,
    rationale,
    action,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `DiagnosticRecommendation.${field} is required.`,
      );
    }
  }

  const normalizedType = String(type).trim().toUpperCase();
  if (!DIAGNOSTIC_RECOMMENDATION_TYPES.includes(normalizedType)) {
    throw new TypeError(
      `Unsupported diagnostic recommendation type: ${normalizedType}`,
    );
  }

  const normalizedPriority = String(priority).trim().toUpperCase();
  if (!DIAGNOSTIC_RECOMMENDATION_PRIORITIES.includes(normalizedPriority)) {
    throw new TypeError(
      `Unsupported diagnostic recommendation priority: ${normalizedPriority}`,
    );
  }

  return Object.freeze({
    schemaVersion: DIAGNOSTIC_RECOMMENDATION_SCHEMA_VERSION,
    id: String(id).trim(),
    hypothesisId:
      hypothesisId === null ? null : String(hypothesisId).trim(),
    type: normalizedType,
    priority: normalizedPriority,
    title: String(title).trim(),
    rationale: String(rationale).trim(),
    action: String(action).trim(),
    triggerStatuses: uniqueStrings(
      triggerStatuses.map((value) => String(value).toUpperCase()),
    ),
    requiredSourceTypes: uniqueStrings(
      requiredSourceTypes.map((value) => String(value).toUpperCase()),
    ),
    evidenceSourceIds: uniqueStrings(evidenceSourceIds),
    blocksAutomation: Boolean(blocksAutomation),
    requiresHumanReview: Boolean(requiresHumanReview),
    version: String(version).trim(),
    status: String(status).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
