export const DASHBOARD_FILTER_ENGINE_VERSION =
  "CGL-000006-S2-v1.0.0";

export class DashboardFilterEngine {
  applyMetrics(metrics = [], filters = []) {
    return Object.freeze(
      metrics.filter((metric) =>
        filters.every((filter) => {
          const actual = metric[filter.field];
          const operator = filter.operator;
          const expected = filter.value;

          if (operator === "EQ") return actual === expected;
          if (operator === "NEQ") return actual !== expected;
          if (operator === "GT") return Number(actual) > Number(expected);
          if (operator === "GTE") return Number(actual) >= Number(expected);
          if (operator === "LT") return Number(actual) < Number(expected);
          if (operator === "LTE") return Number(actual) <= Number(expected);
          return true;
        }),
      ),
    );
  }
}
