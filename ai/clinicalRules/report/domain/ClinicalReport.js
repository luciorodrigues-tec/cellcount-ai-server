export const CLINICAL_REPORT_SCHEMA_VERSION =
  "CRR-000013-v1";

export function createClinicalReport({
  reportId,
  requestId,
  executionId,
  title = "CellCount Clinical Decision Support Report",
  sections = [],
  summary = null,
  requiresHumanReview = false,
  warnings = [],
  createdAt,
  engineVersions = {},
  metadata = {},
} = {}) {
  for (const [field, value] of Object.entries({
    reportId,
    requestId,
    executionId,
    createdAt,
  })) {
    if (!value || !String(value).trim()) {
      throw new TypeError(
        `ClinicalReport.${field} is required.`,
      );
    }
  }

  const orderedSections = [
    ...(Array.isArray(sections) ? sections : []),
  ].sort(
    (a, b) =>
      a.order - b.order ||
      a.id.localeCompare(b.id),
  );

  return Object.freeze({
    schemaVersion:
      CLINICAL_REPORT_SCHEMA_VERSION,
    reportId: String(reportId).trim(),
    requestId: String(requestId).trim(),
    executionId: String(executionId).trim(),
    title: String(title).trim(),
    summary,
    sections: Object.freeze(
      orderedSections,
    ),
    requiresHumanReview: Boolean(
      requiresHumanReview,
    ),
    warnings: Object.freeze([
      ...(Array.isArray(warnings) ? warnings : []),
    ]),
    createdAt: String(createdAt),
    engineVersions: Object.freeze({
      ...(engineVersions &&
      typeof engineVersions === "object"
        ? engineVersions
        : {}),
    }),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
    safetyStatement:
      "This report is clinical decision support and not a definitive diagnosis.",
  });
}
