export const POLICY_THRESHOLD_EVALUATOR_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyThresholdEvaluator {
  evaluate(thresholds = [], context = {}) {
    const results = thresholds.map((threshold) => {
      const actual = Number(context[threshold.key]);
      const configured = Number(threshold.value);

      return Object.freeze({
        key: threshold.key,
        configured,
        actual:
          Number.isFinite(actual)
            ? actual
            : null,
        met:
          Number.isFinite(actual)
            ? actual >= configured
            : false,
      });
    });

    return Object.freeze(results);
  }
}
