import {
  RankingDominance,
} from "./RankingPolicy.js";

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

export function calculateMargin(
  winner,
  runnerUp,
) {
  if (!winner || !runnerUp) {
    return winner ? 1 : 0;
  }

  return clamp01(
    Number(
      winner.normalizedScore || 0,
    ) -
    Number(
      runnerUp.normalizedScore || 0,
    ),
  );
}

export function calculateRelativeMargin(
  winner,
  runnerUp,
) {
  if (!winner || !runnerUp) {
    return winner ? 1 : 0;
  }

  const winnerScore =
    Number(
      winner.normalizedScore || 0,
    );

  const difference =
    winnerScore -
    Number(
      runnerUp.normalizedScore || 0,
    );

  if (winnerScore <= 0) {
    return 0;
  }

  return clamp01(
    difference / winnerScore,
  );
}

export function classifyDominance(
  margin,
  policy,
) {
  if (margin >= policy.dominanceHighThreshold) {
    return RankingDominance.high;
  }

  if (
    margin >=
    policy.dominanceModerateThreshold
  ) {
    return RankingDominance.moderate;
  }

  if (margin > 0) {
    return RankingDominance.low;
  }

  return RankingDominance.none;
}

export function detectAmbiguity(
  margin,
  candidateCount,
  policy,
) {
  return (
    candidateCount >= 2 &&
    margin <= policy.ambiguityThreshold
  );
}

export function evaluateWinnerStrength(
  winner,
  policy,
) {
  if (!winner) {
    return Object.freeze({
      strongEnough: false,
      reasons: Object.freeze([
        "NO_ELIGIBLE_CANDIDATE",
      ]),
    });
  }

  const reasons = [];

  if (
    Number(winner.score || 0) <
    policy.minimumWinnerScore
  ) {
    reasons.push(
      "WINNER_BELOW_MINIMUM_SCORE",
    );
  }

  if (
    Number(
      winner.normalizedScore || 0,
    ) <
    policy.minimumWinnerNormalizedScore
  ) {
    reasons.push(
      "WINNER_BELOW_MINIMUM_NORMALIZED_SCORE",
    );
  }

  if (
    Number(winner.coverage || 0) <
    policy.minimumWinnerCoverage
  ) {
    reasons.push(
      "WINNER_BELOW_MINIMUM_COVERAGE",
    );
  }

  return Object.freeze({
    strongEnough:
      reasons.length === 0,
    reasons:
      Object.freeze(reasons),
  });
}
