export const QUALITY_THRESHOLD_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export const QUALITY_THRESHOLD_OPERATORS =
  Object.freeze([
    "GT",
    "GTE",
    "LT",
    "LTE",
    "EQ",
    "NEQ",
  ]);

export function createQualityThreshold({
  thresholdId,
  operator,
  value,
  unit = null,
  severity = "MEDIUM",
  metadata = {},
} = {}) {
  if (!thresholdId) {
    throw new TypeError(
      "QualityThreshold.thresholdId is required.",
    );
  }

  const normalizedOperator =
    String(operator || "").trim().toUpperCase();

  if (
    !QUALITY_THRESHOLD_OPERATORS.includes(
      normalizedOperator,
    )
  ) {
    throw new TypeError(
      `Unsupported quality threshold operator: ${normalizedOperator}`,
    );
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new TypeError(
      "QualityThreshold.value must be numeric.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_THRESHOLD_SCHEMA_VERSION,
    thresholdId: String(thresholdId),
    operator: normalizedOperator,
    value: numeric,
    unit:
      unit === null ? null : String(unit),
    severity:
      String(severity).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
