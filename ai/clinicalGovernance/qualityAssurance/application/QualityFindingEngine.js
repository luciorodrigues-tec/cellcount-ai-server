import {
  createQualityFinding,
} from "../domain/QualityFinding.js";

export const QUALITY_FINDING_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityFindingEngine {
  build(violations = [], {
    detectedAt = new Date(),
  } = {}) {
    return Object.freeze(
      violations.map((violation) =>
        createQualityFinding({
          findingId:
            `FINDING-${violation.violationId}`,
          title:
            `Quality threshold violation: ${violation.metricId}`,
          description:
            `Observed ${violation.observedValue}; expected ${violation.expectedValue}.`,
          severity:
            violation.severity,
          category:
            "COMPLIANCE",
          metricIds:
            [violation.metricId],
          detectedAt:
            detectedAt.toISOString(),
        }),
      ),
    );
  }
}
