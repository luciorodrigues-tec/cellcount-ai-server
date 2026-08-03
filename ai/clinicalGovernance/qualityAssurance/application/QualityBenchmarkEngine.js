export const QUALITY_BENCHMARK_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityBenchmarkEngine {
  compare(metrics = [], benchmarks = []) {
    const benchmarkMap =
      new Map(
        benchmarks.map(
          (benchmark) => [
            benchmark.benchmarkId,
            benchmark,
          ],
        ),
      );

    return Object.freeze(
      metrics
        .filter(
          (metric) =>
            metric.metadata?.benchmarkId &&
            benchmarkMap.has(
              metric.metadata.benchmarkId,
            ),
        )
        .map((metric) => {
          const benchmark =
            benchmarkMap.get(
              metric.metadata.benchmarkId,
            );

          return Object.freeze({
            metricId:
              metric.metricId,
            benchmarkId:
              benchmark.benchmarkId,
            observedValue:
              metric.value,
            expectedValue:
              benchmark.expectedValue,
            delta:
              Number(
                (
                  metric.value -
                  benchmark.expectedValue
                ).toFixed(4),
              ),
          });
        }),
    );
  }
}
