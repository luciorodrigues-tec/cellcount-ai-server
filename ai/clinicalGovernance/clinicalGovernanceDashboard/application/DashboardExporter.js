import {
  DashboardSerializer,
} from "./DashboardSerializer.js";

export const DASHBOARD_EXPORTER_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardExporter {
  constructor({
    serializer = new DashboardSerializer(),
  } = {}) {
    this.serializer = serializer;
  }

  exportJson(dashboard, options = {}) {
    return Object.freeze({
      mimeType: "application/json",
      fileName:
        `${dashboard.dashboardId.toString()}.json`,
      content:
        this.serializer.serialize(
          dashboard,
          options,
        ),
    });
  }
}
