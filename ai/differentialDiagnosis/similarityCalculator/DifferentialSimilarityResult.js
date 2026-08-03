export function createDifferentialSimilarityResult({
  pair,
  baselineSimilarity = 0,
  sharedAgreement = {},
  featureConflict = {},
  coverage = {},
  rankingSupport = {},
  confidenceSupport = {},
  specimenCompatibility = {},
  positiveScore = 0,
  totalConflict = 0,
  finalSimilarity = 0,
  confidenceInterval = {},
  insufficientEvidence = false,
  metadata = {},
} = {}) {
  return Object.freeze({
    pair,
    pairId:
      pair?.id || null,
    primaryCell:
      pair?.primaryCell || null,
    alternativeCell:
      pair?.alternativeCell || null,
    baselineSimilarity,
    sharedAgreement,
    featureConflict,
    coverage,
    rankingSupport,
    confidenceSupport,
    specimenCompatibility,
    positiveScore,
    totalConflict,
    finalSimilarity,
    confidenceInterval:
      Object.freeze({
        ...confidenceInterval,
      }),
    insufficientEvidence:
      insufficientEvidence === true,
    metadata:
      Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
  });
}
