import {
  assertQualityCategory,
} from "./QualityCategory.js";

export const QUALITY_METRIC_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityMetric({
  metricId,
  name,
  category,
  value,
  unit = null,
  threshold = null,
  period = null,
  source = null,
  metadata = {},
} = {}) {
  if (!metricId || !name) {
    throw new TypeError(
      "QualityMetric requires metricId and name.",
    );
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    throw new TypeError(
      "QualityMetric.value must be numeric.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_METRIC_SCHEMA_VERSION,
    metricId: String(metricId),
    name: String(name),
    category:
      assertQualityCategory(category),
    value: numeric,
    unit:
      unit === null ? null : String(unit),
    threshold,
    period,
    source:
      source === null ? null : String(source),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
