import {
  createDashboardWidget,
} from "../domain/DashboardWidget.js";

export const DASHBOARD_WIDGET_FACTORY_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardWidgetFactory {
  createDefaultWidgets(metrics = [], alerts = []) {
    const metricIds =
      new Set(metrics.map((metric) => metric.metricId));

    const widgets = [];
    let position = 1;

    const add = ({
      widgetId,
      type,
      title,
      ids,
    }) => {
      const validIds = ids.filter((id) => metricIds.has(id));
      if (validIds.length === 0 && type !== "ALERT_LIST") return;

      widgets.push(
        createDashboardWidget({
          widgetId,
          type,
          title,
          metricIds: validIds,
          position: position++,
          metadata:
            type === "ALERT_LIST"
              ? { alertCount: alerts.length }
              : {},
        }),
      );
    };

    add({
      widgetId: "CGD-W-QUALITY",
      type: "KPI",
      title: "Quality Score",
      ids: ["CGD-QUALITY-MEAN"],
    });

    add({
      widgetId: "CGD-W-SAFETY",
      type: "KPI",
      title: "Safety Release Rate",
      ids: ["CGD-SAFETY-RELEASE-RATE"],
    });

    add({
      widgetId: "CGD-W-GOVERNANCE",
      type: "TABLE",
      title: "Governance Activity",
      ids: [
        "CGD-AUDIT-COUNT",
        "CGD-PROVENANCE-COUNT",
        "CGD-POLICY-DECISIONS",
        "CGD-GUIDELINE-EXECUTIONS",
      ],
    });

    add({
      widgetId: "CGD-W-ALERTS",
      type: "ALERT_LIST",
      title: "Active Alerts",
      ids: [],
    });

    return Object.freeze(widgets);
  }
}
