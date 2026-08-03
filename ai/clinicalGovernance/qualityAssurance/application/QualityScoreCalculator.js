import {
  QualityScore,
} from "../domain/QualityScore.js";

export const QUALITY_SCORE_CALCULATOR_VERSION =
  "CGL-000005-S2-v1.0.0";

export class QualityScoreCalculator {
  calculate({
    metrics = [],
    violations = [],
    alerts = [],
  } = {}) {
    if (metrics.length === 0) {
      return new QualityScore(0);
    }

    const base = 100;

    const violationPenalty =
      violations.reduce(
        (total, violation) => {
          const weights = {
            INFO: 1,
            LOW: 3,
            MEDIUM: 7,
            HIGH: 15,
            CRITICAL: 30,
          };
          return total + (weights[violation.severity] || 0);
        },
        0,
      );

    const alertPenalty =
      alerts.reduce(
        (total, alert) => {
          if (!alert.active) return total;

          const weights = {
            INFO: 1,
            LOW: 2,
            MEDIUM: 5,
            HIGH: 10,
            CRITICAL: 20,
          };
          return total + (weights[alert.severity] || 0);
        },
        0,
      );

    return new QualityScore(
      Math.max(
        0,
        Math.min(
          100,
          base - violationPenalty - alertPenalty,
        ),
      ),
    );
  }
}
