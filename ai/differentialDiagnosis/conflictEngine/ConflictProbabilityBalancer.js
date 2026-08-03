function clamp(
  value,
  minimum,
  maximum,
) {
  return Math.max(
    minimum,
    Math.min(maximum, value),
  );
}

export function balanceConflictProbabilities({
  exclusiveFeatureResult,
  evidenceAnalysis,
  severity,
  policy,
} = {}) {
  const baselineWinner =
    Number(
      exclusiveFeatureResult
        ?.pair
        ?.primaryNormalizedScore ||
      0.5,
    );

  const baselineAlternative =
    Number(
      exclusiveFeatureResult
        ?.pair
        ?.alternativeNormalizedScore ||
      0.5,
    );

  const baselineTotal =
    baselineWinner +
    baselineAlternative;

  let winnerProbability =
    baselineTotal > 0
      ? baselineWinner /
        baselineTotal
      : 0.5;

  let alternativeProbability =
    1 - winnerProbability;

  const evidenceTotal =
    evidenceAnalysis
      .totals
      .winnerScore +
    evidenceAnalysis
      .totals
      .alternativeScore;

  const winnerEvidenceShare =
    evidenceTotal > 0
      ? evidenceAnalysis
          .totals
          .winnerScore /
        evidenceTotal
      : 0.5;

  const targetShift =
    (
      winnerEvidenceShare -
      winnerProbability
    ) *
    policy.maximumProbabilityShift *
    Math.max(
      0.25,
      severity.score,
    );

  winnerProbability += targetShift;
  alternativeProbability =
    1 - winnerProbability;

  winnerProbability =
    clamp(
      winnerProbability,
      policy.minimumProbability,
      policy.maximumProbability,
    );

  alternativeProbability =
    clamp(
      alternativeProbability,
      policy.minimumProbability,
      policy.maximumProbability,
    );

  const normalizedTotal =
    winnerProbability +
    alternativeProbability;

  return Object.freeze({
    winnerProbability:
      Number(
        (
          winnerProbability /
          normalizedTotal
        ).toFixed(6),
      ),
    alternativeProbability:
      Number(
        (
          alternativeProbability /
          normalizedTotal
        ).toFixed(6),
      ),
    baselineWinnerProbability:
      Number(
        (
          baselineTotal > 0
            ? baselineWinner /
              baselineTotal
            : 0.5
        ).toFixed(6),
      ),
    baselineAlternativeProbability:
      Number(
        (
          baselineTotal > 0
            ? baselineAlternative /
              baselineTotal
            : 0.5
        ).toFixed(6),
      ),
  });
}
