export const CLINICAL_GOVERNANCE_DASHBOARD_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export class ClinicalGovernanceDashboard {
  constructor({
    dashboardId,
    name,
    scope,
    period,
    metrics = [],
    widgets = [],
    alerts = [],
    snapshots = [],
    filters = [],
    createdAt,
    updatedAt = null,
    metadata = {},
  } = {}) {
    if (
      !dashboardId ||
      !name ||
      !scope ||
      !period ||
      !createdAt
    ) {
      throw new TypeError(
        "ClinicalGovernanceDashboard requires dashboardId, name, scope, period and createdAt.",
      );
    }

    const ensureUnique = (
      values,
      selector,
      label,
    ) => {
      const ids = values.map(selector);

      if (new Set(ids).size !== ids.length) {
        throw new Error(
          `ClinicalGovernanceDashboard contains duplicate ${label}.`,
        );
      }
    };

    ensureUnique(
      metrics,
      (item) => item.metricId,
      "metric ids",
    );
    ensureUnique(
      widgets,
      (item) => item.widgetId,
      "widget ids",
    );
    ensureUnique(
      alerts,
      (item) => item.alertId,
      "alert ids",
    );
    ensureUnique(
      snapshots,
      (item) => item.snapshotId,
      "snapshot ids",
    );
    ensureUnique(
      filters,
      (item) => item.filterId,
      "filter ids",
    );

    const metricIds =
      new Set(
        metrics.map(
          (metric) => metric.metricId,
        ),
      );

    for (const widget of widgets) {
      for (const metricId of widget.metricIds) {
        if (!metricIds.has(metricId)) {
          throw new Error(
            `Dashboard widget references unknown metric: ${metricId}`,
          );
        }
      }
    }

    this.schemaVersion =
      CLINICAL_GOVERNANCE_DASHBOARD_SCHEMA_VERSION;
    this.dashboardId = dashboardId;
    this.name = String(name);
    this.scope = scope;
    this.period = period;
    this.metrics =
      Object.freeze([...metrics]);
    this.widgets =
      Object.freeze(
        [...widgets].sort(
          (a, b) => a.position - b.position,
        ),
      );
    this.alerts =
      Object.freeze([...alerts]);
    this.snapshots =
      Object.freeze([...snapshots]);
    this.filters =
      Object.freeze([...filters]);
    this.createdAt =
      new Date(createdAt).toISOString();
    this.updatedAt =
      updatedAt === null
        ? null
        : new Date(updatedAt).toISOString();
    this.metadata = Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    });

    Object.freeze(this);
  }

  hasCriticalAlert() {
    return this.alerts.some(
      (alert) =>
        alert.active &&
        alert.severity === "CRITICAL",
    );
  }
}
