import {
  createQualityTrend,
} from "../domain/QualityTrend.js";

export const QUALITY_TREND_ENGINE_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityTrendEngine {
  calculate(scores = []) {
    if (scores.length < 2) {
      return createQualityTrend({
        direction: "INSUFFICIENT_DATA",
        delta: 0,
        windowSize: scores.length,
      });
    }

    const first =
      Number(scores[0]?.value ?? scores[0]);
    const last =
      Number(
        scores[scores.length - 1]?.value ??
        scores[scores.length - 1],
      );

    const delta =
      Number((last - first).toFixed(4));

    let direction = "STABLE";

    if (delta > 1) {
      direction = "IMPROVING";
    } else if (delta < -1) {
      direction = "DEGRADING";
    }

    return createQualityTrend({
      direction,
      delta,
      windowSize: scores.length,
    });
  }
}
