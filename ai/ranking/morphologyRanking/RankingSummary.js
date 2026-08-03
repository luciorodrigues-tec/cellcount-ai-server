export function createRankingSummary({
  winner = null,
  runnerUp = null,
  absoluteMargin = 0,
  relativeMargin = 0,
  dominance = "NONE",
  ambiguous = false,
  tie = false,
  winnerStrength = {},
  humanReviewRecommended = false,
  reviewReasons = [],
  candidateCount = 0,
} = {}) {
  return Object.freeze({
    winner,
    runnerUp,
    absoluteMargin,
    relativeMargin,
    dominance,
    ambiguous: ambiguous === true,
    tie: tie === true,
    winnerStrength:
      Object.freeze({
        ...winnerStrength,
      }),
    humanReviewRecommended:
      humanReviewRecommended === true,
    reviewReasons:
      Object.freeze([
        ...reviewReasons,
      ]),
    candidateCount,
  });
}
