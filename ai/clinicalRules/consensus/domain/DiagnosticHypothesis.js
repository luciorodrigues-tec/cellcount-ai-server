export const DIAGNOSTIC_HYPOTHESIS_SCHEMA_VERSION =
  "CRR-000006-v1";

export const HYPOTHESIS_STATUSES = Object.freeze([
  "SUPPORTED",
  "CONFLICTED",
  "INSUFFICIENT_EVIDENCE",
  "REJECTED",
  "ABSTAINED",
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

export function createDiagnosticHypothesis({
  id,
  label,
  category = "DIAGNOSTIC_HYPOTHESIS",
  status = "INSUFFICIENT_EVIDENCE",
  supportingRuleIds = [],
  opposingRuleIds = [],
  requiredRuleIds = [],
  excludedRuleIds = [],
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError(
      "DiagnosticHypothesis.id is required.",
    );
  }

  if (!label || !String(label).trim()) {
    throw new TypeError(
      "DiagnosticHypothesis.label is required.",
    );
  }

  const normalizedStatus = String(status)
    .trim()
    .toUpperCase();

  if (!HYPOTHESIS_STATUSES.includes(normalizedStatus)) {
    throw new TypeError(
      `Unsupported hypothesis status: ${normalizedStatus}`,
    );
  }

  return Object.freeze({
    schemaVersion: DIAGNOSTIC_HYPOTHESIS_SCHEMA_VERSION,
    id: String(id).trim(),
    label: String(label).trim(),
    category: String(category).trim().toUpperCase(),
    status: normalizedStatus,
    supportingRuleIds: uniqueStrings(supportingRuleIds),
    opposingRuleIds: uniqueStrings(opposingRuleIds),
    requiredRuleIds: uniqueStrings(requiredRuleIds),
    excludedRuleIds: uniqueStrings(excludedRuleIds),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
