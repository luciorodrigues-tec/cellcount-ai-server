export function createScoreResult({
  cellId,
  criteriaId,
  positiveScore = 0,
  negativePenalty = 0,
  exclusionPenalty = 0,
  limitationPenalty = 0,
  requiredPenalty = 0,
  rawScore = 0,
  finalScore = 0,
  normalizedScore = 0,
  maximumPositiveScore = 0,
  requiredSatisfied = false,
  minimumScoreSatisfied = false,
  excluded = false,
  blocked = false,
  contributions = [],
  summary = {},
} = {}) {
  return Object.freeze({
    cellId,
    criteriaId,
    positiveScore,
    negativePenalty,
    exclusionPenalty,
    limitationPenalty,
    requiredPenalty,
    rawScore,
    finalScore,
    normalizedScore,
    maximumPositiveScore,
    requiredSatisfied,
    minimumScoreSatisfied,
    excluded,
    blocked,
    contributions:
      Object.freeze(
        [...contributions],
      ),
    summary:
      Object.freeze({
        ...summary,
      }),
  });
}
