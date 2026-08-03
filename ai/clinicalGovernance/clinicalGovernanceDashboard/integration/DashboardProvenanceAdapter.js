export const DASHBOARD_PROVENANCE_ADAPTER_VERSION =
  "CGL-000006-S3-v1.0.0";

export class DashboardProvenanceAdapter {
  toProvenancePayload(dashboard) {
    if (!dashboard) {
      throw new TypeError(
        "DashboardProvenanceAdapter.dashboard is required.",
      );
    }

    const dashboardNode = Object.freeze({
      nodeId: `DASHBOARD-${dashboard.dashboardId.toString()}`,
      type: "REPORT",
      label: dashboard.name,
      metadata: Object.freeze({
        scope: dashboard.scope.type,
        targetId: dashboard.scope.targetId,
      }),
    });

    const metricNodes = Object.freeze(
      dashboard.metrics.map((metric) =>
        Object.freeze({
          nodeId: `DASHBOARD-METRIC-${metric.metricId}`,
          type: "FEATURE",
          label: metric.name,
          metadata: Object.freeze({
            value: metric.value,
            unit: metric.unit,
            category: metric.category,
            sourceModule: metric.sourceModule,
          }),
        }),
      ),
    );

    const alertNodes = Object.freeze(
      dashboard.alerts.map((alert) =>
        Object.freeze({
          nodeId: `DASHBOARD-ALERT-${alert.alertId}`,
          type: "OBSERVATION",
          label: alert.message,
          metadata: Object.freeze({
            severity: alert.severity,
            sourceModule: alert.sourceModule,
            active: alert.active,
          }),
        }),
      ),
    );

    return Object.freeze({
      dashboardNode,
      metricNodes,
      alertNodes,
    });
  }
}
