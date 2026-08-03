import {
  createQualityViolation,
} from "../domain/QualityViolation.js";

export const QUALITY_THRESHOLD_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityThresholdEngine {
  evaluate(metric, {
    occurredAt = new Date(),
  } = {}) {
    const threshold = metric.threshold;

    if (!threshold) {
      return Object.freeze({
        violated: false,
        violation: null,
      });
    }

    const observed = Number(metric.value);
    const expected = Number(threshold.value);

    const comparisons = {
      GT: observed > expected,
      GTE: observed >= expected,
      LT: observed < expected,
      LTE: observed <= expected,
      EQ: observed === expected,
      NEQ: observed !== expected,
    };

    const passed = comparisons[threshold.operator] === true;

    if (passed) {
      return Object.freeze({
        violated: false,
        violation: null,
      });
    }

    return Object.freeze({
      violated: true,
      violation:
        createQualityViolation({
          violationId:
            `VIOLATION-${metric.metricId}-${threshold.thresholdId}`,
          thresholdId:
            threshold.thresholdId,
          metricId:
            metric.metricId,
          observedValue:
            observed,
          expectedValue:
            expected,
          severity:
            threshold.severity,
          occurredAt:
            occurredAt.toISOString(),
        }),
    });
  }
}
