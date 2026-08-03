import {
  CANDIDATE_GENERATOR_VERSION,
  mergeCandidateThresholds,
} from "./CandidateThresholds.js";

import {
  compareCandidates,
} from "./CandidateComparator.js";

import {
  createCandidateFromScore,
} from "./CandidateFactory.js";

import {
  buildCandidateStatistics,
} from "./CandidateStatistics.js";

import {
  createCandidateList,
} from "./CandidateList.js";

export class CandidateGenerator {
  constructor({
    thresholds = {},
  } = {}) {
    this.thresholds =
      mergeCandidateThresholds(
        thresholds,
      );
  }

  generate(
    scoreResults = [],
    {
      specimenType = null,
    } = {},
  ) {
    const candidates =
      scoreResults.map(
        (scoreResult) =>
          createCandidateFromScore(
            scoreResult,
            this.thresholds,
          ),
      );

    const eligible =
      candidates
        .filter(
          (candidate) =>
            candidate.eligible,
        )
        .sort(compareCandidates)
        .slice(
          0,
          this.thresholds
            .maxEligibleCandidates,
        );

    const eligibleIds =
      new Set(
        eligible.map(
          (candidate) =>
            candidate.cellId,
        ),
      );

    const rejected =
      candidates
        .filter(
          (candidate) =>
            !eligibleIds.has(
              candidate.cellId,
            ),
        )
        .sort(compareCandidates);

    const statistics =
      buildCandidateStatistics(
        candidates,
      );

    return createCandidateList({
      version:
        CANDIDATE_GENERATOR_VERSION,
      specimenType,
      eligible,
      rejected,
      statistics,
      thresholds:
        this.thresholds,
    });
  }
}
