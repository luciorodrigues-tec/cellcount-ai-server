export const RANKING_HYPOTHESIS_SCHEMA_VERSION =
  "CRR-000010-v1";

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

export function createRankingHypothesis({
  id,
  label,
  category = "DIAGNOSTIC_HYPOTHESIS",
  competingHypothesisIds = [],
  exclusionHypothesisIds = [],
  requiredSourceTypes = [],
  metadata = {},
} = {}) {
  if (!id || !String(id).trim()) {
    throw new TypeError(
      "RankingHypothesis.id is required.",
    );
  }

  if (!label || !String(label).trim()) {
    throw new TypeError(
      "RankingHypothesis.label is required.",
    );
  }

  return Object.freeze({
    schemaVersion: RANKING_HYPOTHESIS_SCHEMA_VERSION,
    id: String(id).trim(),
    label: String(label).trim(),
    category: String(category).trim().toUpperCase(),
    competingHypothesisIds:
      uniqueStrings(competingHypothesisIds),
    exclusionHypothesisIds:
      uniqueStrings(exclusionHypothesisIds),
    requiredSourceTypes:
      uniqueStrings(
        requiredSourceTypes.map((value) =>
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
