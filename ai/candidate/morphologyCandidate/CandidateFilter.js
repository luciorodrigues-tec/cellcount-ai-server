export const CandidateRejectionReason =
  Object.freeze({
    blocked: "BLOCKED",
    excluded: "EXCLUDED",
    missingRequired:
      "MISSING_REQUIRED_CRITERIA",
    belowMinimumScore:
      "BELOW_MINIMUM_SCORE",
    belowNormalizedScore:
      "BELOW_MINIMUM_NORMALIZED_SCORE",
    belowCoverage:
      "BELOW_MINIMUM_COVERAGE",
    minimumScoreNotSatisfied:
      "MINIMUM_WEIGHTED_SCORE_NOT_SATISFIED",
  });

export function evaluateCandidateEligibility(
  scoreResult,
  thresholds,
) {
  const reasons = [];

  if (
    scoreResult.blocked === true &&
    thresholds.allowBlocked !== true
  ) {
    reasons.push(
      CandidateRejectionReason.blocked,
    );
  }

  if (
    scoreResult.excluded === true &&
    thresholds.allowExcluded !== true
  ) {
    reasons.push(
      CandidateRejectionReason.excluded,
    );
  }

  if (
    thresholds
      .requireRequiredSatisfied === true &&
    scoreResult.requiredSatisfied !== true
  ) {
    reasons.push(
      CandidateRejectionReason
        .missingRequired,
    );
  }

  if (
    thresholds
      .requireMinimumScoreSatisfied === true &&
    scoreResult
      .minimumScoreSatisfied !== true
  ) {
    reasons.push(
      CandidateRejectionReason
        .minimumScoreNotSatisfied,
    );
  }

  if (
    Number(scoreResult.finalScore || 0) <
    thresholds.minimumCandidateScore
  ) {
    reasons.push(
      CandidateRejectionReason
        .belowMinimumScore,
    );
  }

  if (
    Number(
      scoreResult.normalizedScore || 0,
    ) <
    thresholds.minimumNormalizedScore
  ) {
    reasons.push(
      CandidateRejectionReason
        .belowNormalizedScore,
    );
  }

  const coverage =
    Number(
      scoreResult.summary
        ?.overallCoverage || 0,
    );

  if (
    coverage <
    thresholds.minimumCoverage
  ) {
    reasons.push(
      CandidateRejectionReason
        .belowCoverage,
    );
  }

  return Object.freeze({
    eligible:
      reasons.length === 0,
    reasons:
      Object.freeze(reasons),
  });
}
