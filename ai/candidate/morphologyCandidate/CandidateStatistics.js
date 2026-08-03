export function buildCandidateStatistics(
  candidates = [],
) {
  const statistics = {
    evaluated:
      candidates.length,
    eligible: 0,
    rejected: 0,
    blocked: 0,
    excluded: 0,
    missingRequired: 0,
    lowScore: 0,
    lowNormalizedScore: 0,
    lowCoverage: 0,
    minimumScoreNotSatisfied: 0,
  };

  for (const candidate of candidates) {
    if (candidate.eligible) {
      statistics.eligible += 1;
    } else {
      statistics.rejected += 1;
    }

    const reasons =
      new Set(
        candidate.rejectedReasons,
      );

    if (reasons.has("BLOCKED")) {
      statistics.blocked += 1;
    }

    if (reasons.has("EXCLUDED")) {
      statistics.excluded += 1;
    }

    if (
      reasons.has(
        "MISSING_REQUIRED_CRITERIA",
      )
    ) {
      statistics.missingRequired += 1;
    }

    if (
      reasons.has(
        "BELOW_MINIMUM_SCORE",
      )
    ) {
      statistics.lowScore += 1;
    }

    if (
      reasons.has(
        "BELOW_MINIMUM_NORMALIZED_SCORE",
      )
    ) {
      statistics.lowNormalizedScore += 1;
    }

    if (
      reasons.has(
        "BELOW_MINIMUM_COVERAGE",
      )
    ) {
      statistics.lowCoverage += 1;
    }

    if (
      reasons.has(
        "MINIMUM_WEIGHTED_SCORE_NOT_SATISFIED",
      )
    ) {
      statistics
        .minimumScoreNotSatisfied += 1;
    }
  }

  return Object.freeze(statistics);
}
