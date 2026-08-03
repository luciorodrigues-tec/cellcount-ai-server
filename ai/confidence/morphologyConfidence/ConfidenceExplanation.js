function positiveFactor(
  code,
  value,
  message,
) {
  return Object.freeze({
    code,
    value,
    message,
  });
}

export function buildConfidenceExplanation(
  factors,
  penalties,
) {
  if (!factors.available) {
    return Object.freeze({
      positiveFactors:
        Object.freeze([]),
      negativeFactors:
        Object.freeze([
          Object.freeze({
            code:
              "NO_ELIGIBLE_WINNER",
            value: 1,
            message:
              "No eligible winner was available for confidence calculation.",
          }),
        ]),
    });
  }

  const positiveFactors = [];

  if (factors.winnerScore >= 0.75) {
    positiveFactors.push(
      positiveFactor(
        "HIGH_WINNER_SCORE",
        factors.winnerScore,
        "Winner has a high normalized score.",
      ),
    );
  } else if (
    factors.winnerScore >= 0.55
  ) {
    positiveFactors.push(
      positiveFactor(
        "MODERATE_WINNER_SCORE",
        factors.winnerScore,
        "Winner has a moderate normalized score.",
      ),
    );
  }

  if (factors.coverage >= 0.80) {
    positiveFactors.push(
      positiveFactor(
        "HIGH_COVERAGE",
        factors.coverage,
        "Morphologic criteria coverage is high.",
      ),
    );
  } else if (
    factors.coverage >= 0.60
  ) {
    positiveFactors.push(
      positiveFactor(
        "MODERATE_COVERAGE",
        factors.coverage,
        "Morphologic criteria coverage is moderate.",
      ),
    );
  }

  if (factors.margin >= 0.15) {
    positiveFactors.push(
      positiveFactor(
        "LARGE_MARGIN",
        factors.margin,
        "Winner has a large margin over the runner-up.",
      ),
    );
  } else if (
    factors.margin >= 0.05
  ) {
    positiveFactors.push(
      positiveFactor(
        "MODERATE_MARGIN",
        factors.margin,
        "Winner has a moderate margin over the runner-up.",
      ),
    );
  }

  if (
    factors.requiredCoverage === 1
  ) {
    positiveFactors.push(
      positiveFactor(
        "COMPLETE_REQUIRED_COVERAGE",
        factors.requiredCoverage,
        "All required morphologic criteria were matched.",
      ),
    );
  }

  return Object.freeze({
    positiveFactors:
      Object.freeze(
        positiveFactors,
      ),
    negativeFactors:
      Object.freeze(
        penalties.penalties.map(
          (item) =>
            Object.freeze({
              code: item.code,
              value: item.amount,
              message: item.reason,
            }),
        ),
      ),
  });
}
