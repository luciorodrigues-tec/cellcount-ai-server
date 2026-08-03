export function createMatchResult({
  cellId,
  criteriaId,
  specimenTypes = [],
  requiredMatched = 0,
  requiredTotal = 0,
  supportiveMatched = 0,
  supportiveTotal = 0,
  negativeMatched = 0,
  negativeTotal = 0,
  exclusionMatched = 0,
  exclusionTotal = 0,
  limitationMatched = 0,
  limitationTotal = 0,
  excluded = false,
  coverage,
  evidence = [],
  detectedFeatures = [],
  unmatchedRequired = [],
  matchedFeatureIds = [],
} = {}) {
  return Object.freeze({
    cellId,
    criteriaId,
    specimenTypes:
      Object.freeze(
        [...specimenTypes],
      ),
    requiredMatched,
    requiredTotal,
    supportiveMatched,
    supportiveTotal,
    negativeMatched,
    negativeTotal,
    exclusionMatched,
    exclusionTotal,
    limitationMatched,
    limitationTotal,
    excluded,
    coverage,
    evidence:
      Object.freeze(
        [...evidence],
      ),
    detectedFeatures:
      Object.freeze(
        [...detectedFeatures],
      ),
    unmatchedRequired:
      Object.freeze(
        [...unmatchedRequired],
      ),
    matchedFeatureIds:
      Object.freeze(
        [...matchedFeatureIds],
      ),
  });
}
