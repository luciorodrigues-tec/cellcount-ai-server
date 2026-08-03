export const DASHBOARD_PERIOD_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export function createDashboardPeriod({
  startedAt,
  endedAt,
  timezone = "UTC",
} = {}) {
  if (!startedAt || !endedAt) {
    throw new TypeError(
      "DashboardPeriod requires startedAt and endedAt.",
    );
  }

  const start = new Date(startedAt);
  const end = new Date(endedAt);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new TypeError(
      "DashboardPeriod dates must be valid.",
    );
  }

  if (end < start) {
    throw new TypeError(
      "DashboardPeriod.endedAt must not precede startedAt.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_PERIOD_SCHEMA_VERSION,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    timezone: String(timezone),
  });
}
