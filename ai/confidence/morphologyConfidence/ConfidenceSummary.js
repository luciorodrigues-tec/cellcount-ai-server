export function createConfidenceSummary({
  version,
  winner = null,
  score = 0,
  level = "UNAVAILABLE",
  available = false,
  factors = {},
  penalties = {},
  explanation = {},
  humanReviewRecommended = true,
  reviewReasons = [],
  rankingPreserved = true,
  processingTimeMs = 0,
  policy = {},
} = {}) {
  return Object.freeze({
    version,
    winner,
    score,
    level,
    available: available === true,
    factors:
      Object.freeze({
        ...factors,
      }),
    penalties:
      Object.freeze({
        ...penalties,
      }),
    explanation:
      Object.freeze({
        ...explanation,
      }),
    humanReviewRecommended:
      humanReviewRecommended === true,
    reviewReasons:
      Object.freeze([
        ...reviewReasons,
      ]),
    rankingPreserved:
      rankingPreserved === true,
    metrics:
      Object.freeze({
        processingTimeMs,
        policyVersion:
          version,
      }),
    policy,
  });
}
