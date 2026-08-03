export function createExplanationSummary({
  version,
  specimenType = null,
  winner = null,
  runnerUp = null,
  confidence = null,
  narrative = {},
  evidence = {},
  alternatives = [],
  rejectedCandidates = [],
  humanReviewRecommended = false,
  reviewReasons = [],
  rankingPreserved = true,
  confidencePreserved = true,
  processingTimeMs = 0,
  policy = {},
} = {}) {
  return Object.freeze({
    version,
    specimenType,
    winner,
    runnerUp,
    confidence,
    narrative:
      Object.freeze({
        ...narrative,
      }),
    evidence:
      Object.freeze({
        ...evidence,
      }),
    alternatives:
      Object.freeze([
        ...alternatives,
      ]),
    rejectedCandidates:
      Object.freeze([
        ...rejectedCandidates,
      ]),
    humanReviewRecommended:
      humanReviewRecommended === true,
    reviewReasons:
      Object.freeze([
        ...reviewReasons,
      ]),
    rankingPreserved:
      rankingPreserved === true,
    confidencePreserved:
      confidencePreserved === true,
    metrics:
      Object.freeze({
        processingTimeMs,
        engineVersion:
          version,
      }),
    policy,
  });
}
