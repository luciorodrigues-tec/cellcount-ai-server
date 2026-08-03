export const QUALITY_BENCHMARK_SCHEMA_VERSION =
  "CGL-000005-S1-v1";

export function createQualityBenchmark({
  benchmarkId,
  name,
  source,
  expectedValue,
  unit = null,
  version = null,
  metadata = {},
} = {}) {
  if (!benchmarkId || !name || !source) {
    throw new TypeError(
      "QualityBenchmark requires benchmarkId, name and source.",
    );
  }

  const numeric = Number(expectedValue);

  if (!Number.isFinite(numeric)) {
    throw new TypeError(
      "QualityBenchmark.expectedValue must be numeric.",
    );
  }

  return Object.freeze({
    schemaVersion:
      QUALITY_BENCHMARK_SCHEMA_VERSION,
    benchmarkId: String(benchmarkId),
    name: String(name),
    source: String(source),
    expectedValue: numeric,
    unit:
      unit === null ? null : String(unit),
    version:
      version === null ? null : String(version),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
