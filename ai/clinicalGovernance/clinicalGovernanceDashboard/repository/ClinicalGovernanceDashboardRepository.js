export const CLINICAL_GOVERNANCE_DASHBOARD_REPOSITORY_VERSION =
  "CGL-000006-S3-v1.0.0";

export class ClinicalGovernanceDashboardRepository {
  constructor({
    version = CLINICAL_GOVERNANCE_DASHBOARD_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._dashboards = new Map();
  }

  save(dashboard, { replace = false } = {}) {
    const key = dashboard.dashboardId.toString();

    if (this._dashboards.has(key) && !replace) {
      throw new Error(
        `Clinical governance dashboard already exists: ${key}`,
      );
    }

    this._dashboards.set(key, dashboard);
    return dashboard;
  }

  getByDashboardId(id) {
    const key = typeof id === "string" ? id : id.toString();
    return this._dashboards.get(key) || null;
  }

  findByScope(type, targetId = null) {
    const normalized = String(type).trim().toUpperCase();

    return Object.freeze(
      [...this._dashboards.values()].filter((dashboard) =>
        dashboard.scope.type === normalized &&
        (
          normalized === "GLOBAL" ||
          String(dashboard.scope.targetId) === String(targetId)
        ),
      ),
    );
  }

  findByPeriod({ startedAt, endedAt } = {}) {
    if (!startedAt || !endedAt) {
      throw new TypeError(
        "ClinicalGovernanceDashboardRepository.findByPeriod requires startedAt and endedAt.",
      );
    }

    const start = new Date(startedAt);
    const end = new Date(endedAt);

    return Object.freeze(
      [...this._dashboards.values()].filter((dashboard) => {
        const dashStart = new Date(dashboard.period.startedAt);
        const dashEnd = new Date(dashboard.period.endedAt);

        return dashStart <= end && dashEnd >= start;
      }),
    );
  }

  findWithCriticalAlerts() {
    return Object.freeze(
      [...this._dashboards.values()].filter(
        (dashboard) => dashboard.hasCriticalAlert(),
      ),
    );
  }

  list({ limit = null, offset = 0 } = {}) {
    const values = [...this._dashboards.values()];
    const start = Math.max(0, Number(offset) || 0);
    const end =
      limit === null
        ? undefined
        : start + Math.max(0, Number(limit) || 0);

    return Object.freeze(values.slice(start, end));
  }

  exists(id) {
    return this.getByDashboardId(id) !== null;
  }

  delete(id) {
    const key = typeof id === "string" ? id : id.toString();
    const dashboard = this._dashboards.get(key);

    if (!dashboard) {
      return false;
    }

    if (dashboard.snapshots.length > 0) {
      throw new Error(
        "Dashboards with snapshots cannot be deleted.",
      );
    }

    return this._dashboards.delete(key);
  }

  count() {
    return this._dashboards.size;
  }
}
