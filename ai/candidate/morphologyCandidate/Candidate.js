export const CandidateStatus =
  Object.freeze({
    eligible: "ELIGIBLE",
    rejected: "REJECTED",
  });

export function createCandidate({
  cellId,
  criteriaId,
  score = 0,
  normalizedScore = 0,
  coverage = 0,
  eligible = false,
  status =
    eligible
      ? CandidateStatus.eligible
      : CandidateStatus.rejected,
  rejectedReasons = [],
  blocked = false,
  excluded = false,
  requiredSatisfied = false,
  minimumScoreSatisfied = false,
  confidence = null,
  sourceScore = null,
} = {}) {
  return Object.freeze({
    cellId,
    criteriaId,
    score,
    normalizedScore,
    coverage,
    eligible: eligible === true,
    status,
    rejectedReasons:
      Object.freeze([
        ...rejectedReasons,
      ]),
    blocked: blocked === true,
    excluded: excluded === true,
    requiredSatisfied:
      requiredSatisfied === true,
    minimumScoreSatisfied:
      minimumScoreSatisfied === true,
    confidence,
    sourceScore,
  });
}
