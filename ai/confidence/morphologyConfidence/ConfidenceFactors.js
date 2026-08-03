function clamp01(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number),
  );
}

export function calculateConfidenceFactors(
  rankingResult,
  policy,
) {
  const winner =
    rankingResult?.winner || null;

  if (!winner) {
    return Object.freeze({
      available: false,
      winnerScore: 0,
      coverage: 0,
      margin: 0,
      requiredCoverage: 0,
      weightedWinnerScore: 0,
      weightedCoverage: 0,
      weightedMargin: 0,
      weightedRequiredCoverage: 0,
      positiveScore: 0,
    });
  }

  const winnerScore =
    clamp01(
      winner.normalizedScore,
    );

  const coverage =
    clamp01(
      winner.coverage,
    );

  const margin =
    clamp01(
      rankingResult
        ?.summary
        ?.absoluteMargin || 0,
    );

  const requiredCoverage =
    clamp01(
      winner.requiredCoverage,
    );

  const weightedWinnerScore =
    winnerScore *
    policy.winnerScoreWeight;

  const weightedCoverage =
    coverage *
    policy.coverageWeight;

  const weightedMargin =
    margin *
    policy.marginWeight;

  const weightedRequiredCoverage =
    requiredCoverage *
    policy.requiredCoverageWeight;

  const positiveScore =
    weightedWinnerScore +
    weightedCoverage +
    weightedMargin +
    weightedRequiredCoverage;

  return Object.freeze({
    available: true,
    winnerScore,
    coverage,
    margin,
    requiredCoverage,
    weightedWinnerScore,
    weightedCoverage,
    weightedMargin,
    weightedRequiredCoverage,
    positiveScore,
  });
}
