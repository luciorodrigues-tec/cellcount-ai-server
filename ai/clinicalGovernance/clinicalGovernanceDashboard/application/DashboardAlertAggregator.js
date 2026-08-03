import {
  createDashboardAlert,
} from "../domain/DashboardAlert.js";

export const DASHBOARD_ALERT_AGGREGATOR_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardAlertAggregator {
  aggregate({
    qualityRecords = [],
    safetyResults = [],
    createdAt = new Date(),
  } = {}) {
    const alerts = [];

    for (const record of qualityRecords) {
      for (const alert of record.alerts || []) {
        if (!alert.active) continue;

        alerts.push(
          createDashboardAlert({
            alertId: `CGD-${alert.alertId}`,
            code: alert.code,
            message: alert.message,
            severity: alert.severity,
            sourceModule: "CGL-000005",
            active: true,
            createdAt,
          }),
        );
      }
    }

    safetyResults.forEach((result, index) => {
      if (
        result?.releaseAllowed === false ||
        result?.requiresHumanReview === true
      ) {
        alerts.push(
          createDashboardAlert({
            alertId: `CGD-SAFETY-${index + 1}`,
            code: "SAFETY_REVIEW_REQUIRED",
            message:
              "Clinical safety gate requires review or blocks release.",
            severity:
              result?.releaseAllowed === false
                ? "HIGH"
                : "MEDIUM",
            sourceModule: "CRR-000034",
            active: true,
            createdAt,
          }),
        );
      }
    });

    return Object.freeze(alerts);
  }
}
