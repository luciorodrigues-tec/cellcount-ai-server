export const DASHBOARD_AUDIT_ADAPTER_VERSION =
  "CGL-000006-S3-v1.0.0";

export class DashboardAuditAdapter {
  toAuditPayload(dashboard) {
    if (!dashboard) {
      throw new TypeError(
        "DashboardAuditAdapter.dashboard is required.",
      );
    }

    return Object.freeze({
      dashboardId: dashboard.dashboardId.toString(),
      scopeType: dashboard.scope.type,
      scopeTargetId: dashboard.scope.targetId,
      metricCount: dashboard.metrics.length,
      widgetCount: dashboard.widgets.length,
      alertCount: dashboard.alerts.length,
      snapshotCount: dashboard.snapshots.length,
      hasCriticalAlert: dashboard.hasCriticalAlert(),
      period: dashboard.period,
    });
  }
}
