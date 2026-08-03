export const QUALITY_TREND_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export const QUALITY_TRENDS = Object.freeze([
  "IMPROVING",
  "STABLE",
  "DEGRADING",
  "INSUFFICIENT_DATA",
]);

export function createQualityTrend({
  direction,
  delta = 0,
  windowSize = 0,
} = {}) {
  const normalized =
    String(direction || "").trim().toUpperCase();

  if (!QUALITY_TRENDS.includes(normalized)) {
    throw new TypeError(
      `Unsupported quality trend: ${normalized}`,
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_TREND_SCHEMA_VERSION,
    direction: normalized,
    delta: Number(delta),
    windowSize: Number(windowSize),
  });
}
