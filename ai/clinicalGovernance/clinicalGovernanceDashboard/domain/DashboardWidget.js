export const DASHBOARD_WIDGET_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export const DASHBOARD_WIDGET_TYPES = Object.freeze([
  "KPI",
  "TREND",
  "TABLE",
  "ALERT_LIST",
  "STATUS",
  "DISTRIBUTION",
]);

export function createDashboardWidget({
  widgetId,
  type,
  title,
  metricIds = [],
  position = 1,
  visible = true,
  metadata = {},
} = {}) {
  if (!widgetId || !title) {
    throw new TypeError(
      "DashboardWidget requires widgetId and title.",
    );
  }

  const normalized =
    String(type || "").trim().toUpperCase();

  if (!DASHBOARD_WIDGET_TYPES.includes(normalized)) {
    throw new TypeError(
      `Unsupported dashboard widget type: ${normalized}`,
    );
  }

  const numericPosition = Number(position);

  if (
    !Number.isInteger(numericPosition) ||
    numericPosition < 1
  ) {
    throw new TypeError(
      "DashboardWidget.position must be a positive integer.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_WIDGET_SCHEMA_VERSION,
    widgetId: String(widgetId),
    type: normalized,
    title: String(title),
    metricIds:
      Object.freeze([...metricIds]),
    position: numericPosition,
    visible: Boolean(visible),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
