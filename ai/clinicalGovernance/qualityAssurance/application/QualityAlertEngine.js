import {
  createQualityAlert,
} from "../domain/QualityAlert.js";

export const QUALITY_ALERT_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityAlertEngine {
  build(findings = [], {
    createdAt = new Date(),
  } = {}) {
    return Object.freeze(
      findings
        .filter((finding) =>
          ["HIGH", "CRITICAL"].includes(
            finding.severity,
          ),
        )
        .map((finding) =>
          createQualityAlert({
            alertId:
              `ALERT-${finding.findingId}`,
            code:
              `QUALITY_${finding.severity}`,
            message:
              finding.description,
            severity:
              finding.severity,
            active: true,
            createdAt:
              createdAt.toISOString(),
          }),
        ),
    );
  }
}
