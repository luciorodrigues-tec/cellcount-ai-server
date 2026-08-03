import {
  MORPHOLOGY_RANKING_VERSION,
  mergeRankingPolicy,
} from "./RankingPolicy.js";

import {
  compareRankedCandidates,
} from "./RankingComparator.js";

import {
  createRankedCandidate,
} from "./RankedCandidate.js";

import {
  calculateMargin,
  calculateRelativeMargin,
  classifyDominance,
  detectAmbiguity,
  evaluateWinnerStrength,
} from "./RankingMetrics.js";

import {
  createRankingSummary,
} from "./RankingSummary.js";

function requiredCoverage(candidate) {
  const matched =
    Number(
      candidate.sourceScore
        ?.summary
        ?.requiredMatched || 0,
    );

  const total =
    Number(
      candidate.sourceScore
        ?.summary
        ?.requiredTotal || 0,
    );

  return total > 0
    ? matched / total
    : 1;
}

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

export class RankingEngine {
  constructor({
    policy = {},
  } = {}) {
    this.policy =
      mergeRankingPolicy(policy);
  }

  rank(
    candidateList,
  ) {
    if (
      !candidateList ||
      typeof candidateList !== "object"
    ) {
      throw new TypeError(
        "candidateList is required.",
      );
    }

    const eligible =
      [
        ...(candidateList.eligible || []),
      ]
        .filter(
          (candidate) =>
            candidate.eligible === true &&
            candidate.blocked !== true &&
            candidate.excluded !== true,
        )
        .sort(
          compareRankedCandidates,
        );

    const provisional =
      eligible.map(
        (candidate, index) => {
          const previous =
            index > 0
              ? eligible[index - 1]
              : null;

          const winner =
            eligible[0] || null;

          return {
            rank:
              index + 1,
            cellId:
              candidate.cellId,
            criteriaId:
              candidate.criteriaId,
            score:
              candidate.score,
            normalizedScore:
              candidate.normalizedScore,
            coverage:
              candidate.coverage,
            requiredCoverage:
              requiredCoverage(
                candidate,
              ),
            marginFromWinner:
              winner
                ? Math.max(
                    0,
                    Number(
                      winner.normalizedScore || 0,
                    ) -
                    Number(
                      candidate.normalizedScore || 0,
                    ),
                  )
                : 0,
            marginFromPrevious:
              previous
                ? Math.max(
                    0,
                    Number(
                      previous.normalizedScore || 0,
                    ) -
                    Number(
                      candidate.normalizedScore || 0,
                    ),
                  )
                : 0,
            isWinner:
              index === 0,
            isRunnerUp:
              index === 1,
            candidate,
          };
        },
      );

    const ranking =
      provisional.map(
        (item) =>
          createRankedCandidate({
            ...item,
            marginFromWinner:
              round(
                item.marginFromWinner,
              ),
            marginFromPrevious:
              round(
                item.marginFromPrevious,
              ),
          }),
      );

    const winner =
      ranking[0] || null;

    const runnerUp =
      ranking[1] || null;

    const absoluteMargin =
      round(
        calculateMargin(
          winner,
          runnerUp,
        ),
      );

    const relativeMargin =
      round(
        calculateRelativeMargin(
          winner,
          runnerUp,
        ),
      );

    const dominance =
      classifyDominance(
        absoluteMargin,
        this.policy,
      );

    const ambiguous =
      detectAmbiguity(
        absoluteMargin,
        ranking.length,
        this.policy,
      );

    const tie =
      Boolean(
        winner &&
        runnerUp &&
        absoluteMargin === 0,
      );

    const winnerStrength =
      evaluateWinnerStrength(
        winner,
        this.policy,
      );

    const reviewReasons = [];

    if (
      ranking.length === 0 &&
      this.policy
        .humanReviewOnNoCandidate
    ) {
      reviewReasons.push(
        "NO_ELIGIBLE_CANDIDATE",
      );
    }

    if (
      ranking.length === 1 &&
      this.policy
        .humanReviewOnSingleCandidate
    ) {
      reviewReasons.push(
        "SINGLE_ELIGIBLE_CANDIDATE",
      );
    }

    if (
      ambiguous &&
      this.policy
        .humanReviewOnAmbiguity
    ) {
      reviewReasons.push(
        "AMBIGUOUS_TOP_CANDIDATES",
      );
    }

    if (
      !winnerStrength.strongEnough &&
      this.policy
        .humanReviewOnWeakWinner
    ) {
      reviewReasons.push(
        ...winnerStrength.reasons,
      );
    }

    const summary =
      createRankingSummary({
        winner,
        runnerUp,
        absoluteMargin,
        relativeMargin,
        dominance,
        ambiguous,
        tie,
        winnerStrength,
        humanReviewRecommended:
          reviewReasons.length > 0,
        reviewReasons:
          [...new Set(reviewReasons)],
        candidateCount:
          ranking.length,
      });

    return Object.freeze({
      version:
        MORPHOLOGY_RANKING_VERSION,
      specimenType:
        candidateList.specimenType ||
        null,
      ranking:
        Object.freeze(ranking),
      winner,
      runnerUp,
      summary,
      policy:
        this.policy,
      rejected:
        candidateList.rejected || [],
      candidateStatistics:
        candidateList.statistics || {},
    });
  }
}
