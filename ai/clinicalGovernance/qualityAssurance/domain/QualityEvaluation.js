export const QUALITY_EVALUATION_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityEvaluation({
  evaluationId,
  score,
  status,
  metricIds = [],
  findingIds = [],
  violationIds = [],
  evaluatedAt,
  metadata = {},
} = {}) {
  if (
    !evaluationId ||
    !score ||
    !status ||
    !evaluatedAt
  ) {
    throw new TypeError(
      "QualityEvaluation requires evaluationId, score, status and evaluatedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_EVALUATION_SCHEMA_VERSION,
    evaluationId: String(evaluationId),
    score,
    status:
      String(status).trim().toUpperCase(),
    metricIds:
      Object.freeze([...metricIds]),
    findingIds:
      Object.freeze([...findingIds]),
    violationIds:
      Object.freeze([...violationIds]),
    evaluatedAt:
      new Date(evaluatedAt).toISOString(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
