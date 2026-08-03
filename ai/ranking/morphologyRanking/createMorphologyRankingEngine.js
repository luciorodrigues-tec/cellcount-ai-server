import {
  createMorphologyCandidateEngine,
} from "../../candidate/morphologyCandidate/index.js";

import {
  RankingEngine,
} from "./RankingEngine.js";

export function createMorphologyRankingEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
} = {}) {
  const candidateEngine =
    createMorphologyCandidateEngine({
      scorePolicy,
      candidateThresholds,
    });

  const rankingEngine =
    new RankingEngine({
      policy:
        rankingPolicy,
    });

  return {
    candidateEngine,
    rankingEngine,

    rankFeatures(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const generated =
        candidateEngine.generate(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const ranking =
        rankingEngine.rank(
          generated.candidates,
        );

      return {
        specimenType:
          specimenType || null,
        generated,
        ranking,
      };
    },
  };
}
