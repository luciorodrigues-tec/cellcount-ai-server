export function createRankedCandidate({
  rank,
  cellId,
  criteriaId,
  score = 0,
  normalizedScore = 0,
  coverage = 0,
  requiredCoverage = 0,
  marginFromWinner = 0,
  marginFromPrevious = 0,
  isWinner = false,
  isRunnerUp = false,
  candidate,
} = {}) {
  return Object.freeze({
    rank,
    cellId,
    criteriaId,
    score,
    normalizedScore,
    coverage,
    requiredCoverage,
    marginFromWinner,
    marginFromPrevious,
    isWinner: isWinner === true,
    isRunnerUp:
      isRunnerUp === true,
    candidate,
  });
}
