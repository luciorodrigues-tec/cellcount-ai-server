export const DASHBOARD_FILTER_SCHEMA_VERSION =
  "CGL-000006-S1-v1";

export function createDashboardFilter({
  filterId,
  field,
  operator,
  value,
} = {}) {
  if (
    !filterId ||
    !field ||
    !operator
  ) {
    throw new TypeError(
      "DashboardFilter requires filterId, field and operator.",
    );
  }

  return Object.freeze({
    schemaVersion:
      DASHBOARD_FILTER_SCHEMA_VERSION,
    filterId: String(filterId),
    field: String(field),
    operator:
      String(operator).trim().toUpperCase(),
    value,
  });
}
