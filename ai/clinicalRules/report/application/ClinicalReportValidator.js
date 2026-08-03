const REQUIRED_SECTION_TYPES = Object.freeze([
  "EXECUTIVE_SUMMARY",
  "SAFETY_ANALYSIS",
]);

export function validateClinicalReport(report) {
  const errors = [];
  const warnings = [];

  if (!report?.reportId) {
    errors.push("reportId is required.");
  }

  if (!report?.requestId) {
    errors.push("requestId is required.");
  }

  if (!report?.executionId) {
    errors.push("executionId is required.");
  }

  const seenIds = new Set();

  for (const section of report?.sections || []) {
    if (seenIds.has(section.id)) {
      errors.push(
        `Duplicated report section id: ${section.id}`,
      );
    }
    seenIds.add(section.id);
  }

  for (const type of REQUIRED_SECTION_TYPES) {
    if (
      !(report?.sections || []).some(
        (section) => section.type === type,
      )
    ) {
      warnings.push(
        `Recommended section missing: ${type}`,
      );
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
  });
}
