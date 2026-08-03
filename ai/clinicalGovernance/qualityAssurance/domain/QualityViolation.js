import {
  assertQualitySeverity,
} from "./QualitySeverity.js";

export const QUALITY_VIOLATION_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityViolation({
  violationId,
  thresholdId,
  metricId,
  observedValue,
  expectedValue,
  severity,
  occurredAt,
  metadata = {},
} = {}) {
  if (
    !violationId ||
    !thresholdId ||
    !metricId ||
    !occurredAt
  ) {
    throw new TypeError(
      "QualityViolation requires violationId, thresholdId, metricId and occurredAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_VIOLATION_SCHEMA_VERSION,
    violationId: String(violationId),
    thresholdId: String(thresholdId),
    metricId: String(metricId),
    observedValue: Number(observedValue),
    expectedValue: Number(expectedValue),
    severity:
      assertQualitySeverity(severity),
    occurredAt:
      new Date(occurredAt).toISOString(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
