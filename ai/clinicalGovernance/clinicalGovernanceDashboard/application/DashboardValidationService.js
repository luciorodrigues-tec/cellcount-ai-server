export const DASHBOARD_VALIDATION_SERVICE_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardValidationService {
  validate(dashboard) {
    const issues = [];

    if (!dashboard?.dashboardId) {
      issues.push("DASHBOARD_ID_MISSING");
    }

    if (!dashboard?.scope) {
      issues.push("DASHBOARD_SCOPE_MISSING");
    }

    if (!dashboard?.period) {
      issues.push("DASHBOARD_PERIOD_MISSING");
    }

    if (!Array.isArray(dashboard?.metrics)) {
      issues.push("DASHBOARD_METRICS_INVALID");
    }

    return Object.freeze({
      valid: issues.length === 0,
      issues: Object.freeze(issues),
    });
  }
}
