import crypto from "node:crypto";

import {
  createDashboardSnapshot,
} from "../domain/DashboardSnapshot.js";

export const DASHBOARD_SNAPSHOT_BUILDER_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardSnapshotBuilder {
  build({
    snapshotId,
    metrics = [],
    alerts = [],
    generatedAt = new Date(),
  } = {}) {
    const payload = JSON.stringify({
      metrics,
      alerts,
    });

    const checksum = crypto
      .createHash("sha256")
      .update(payload)
      .digest("hex");

    return createDashboardSnapshot({
      snapshotId,
      metricIds:
        metrics.map((metric) => metric.metricId),
      alertIds:
        alerts.map((alert) => alert.alertId),
      generatedAt,
      checksum,
    });
  }
}
