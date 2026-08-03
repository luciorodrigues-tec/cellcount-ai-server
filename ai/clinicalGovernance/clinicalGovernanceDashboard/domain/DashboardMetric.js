export const DASHBOARD_METRIC_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export const DASHBOARD_METRIC_CATEGORIES =
  Object.freeze([
    "AUDIT",
    "PROVENANCE",
    "POLICY",
    "GUIDELINE",
    "QUALITY",
    "SAFETY",
    "OPERATIONAL",
  ]);

export function createDashboardMetric({
  metricId,
  name,
  category,
  value,
  unit = null,
  trend = null,
  sourceModule,
  metadata = {},
} = {}) {
  if (!metricId || !name || !sourceModule) {
    throw new TypeError(
      "DashboardMetric requires metricId, name and sourceModule.",
    );
  }

  const normalizedCategory =
    String(category || "").trim().toUpperCase();

  if (
    !DASHBOARD_METRIC_CATEGORIES.includes(
      normalizedCategory,
    )
  ) {
    throw new TypeError(
      `Unsupported dashboard metric category: ${normalizedCategory}`,
    );
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new TypeError(
      "DashboardMetric.value must be numeric.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_METRIC_SCHEMA_VERSION,
    metricId: String(metricId),
    name: String(name),
    category: normalizedCategory,
    value: numeric,
    unit:
      unit === null ? null : String(unit),
    trend,
    sourceModule: String(sourceModule),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
