export const QUALITY_PERIOD_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityPeriod({
  startedAt,
  endedAt,
  timezone = "UTC",
} = {}) {
  if (!startedAt || !endedAt) {
    throw new TypeError(
      "QualityPeriod requires startedAt and endedAt.",
    );
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new TypeError(
      "QualityPeriod dates must be valid.",
    );
  }

  if (end < start) {
    throw new TypeError(
      "QualityPeriod.endedAt must not precede startedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_PERIOD_SCHEMA_VERSION,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    timezone: String(timezone),
  });
}
