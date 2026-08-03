import {
  createCandidate,
} from "./Candidate.js";

import {
  evaluateCandidateEligibility,
} from "./CandidateFilter.js";

export function createCandidateFromScore(
  scoreResult,
  thresholds,
) {
  const evaluation =
    evaluateCandidateEligibility(
      scoreResult,
      thresholds,
    );

  return createCandidate({
    cellId:
      scoreResult.cellId,
    criteriaId:
      scoreResult.criteriaId,
    score:
      Number(
        scoreResult.finalScore || 0,
      ),
    normalizedScore:
      Number(
        scoreResult.normalizedScore || 0,
      ),
    coverage:
      Number(
        scoreResult.summary
          ?.overallCoverage || 0,
      ),
    eligible:
      evaluation.eligible,
    rejectedReasons:
      evaluation.reasons,
    blocked:
      scoreResult.blocked,
    excluded:
      scoreResult.excluded,
    requiredSatisfied:
      scoreResult.requiredSatisfied,
    minimumScoreSatisfied:
      scoreResult.minimumScoreSatisfied,
    confidence: null,
    sourceScore:
      scoreResult,
  });
}
