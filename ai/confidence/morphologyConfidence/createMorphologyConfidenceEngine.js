import {
  createMorphologyRankingEngine,
} from "../../ranking/morphologyRanking/index.js";

import {
  ConfidenceEngine,
} from "./ConfidenceEngine.js";

export function createMorphologyConfidenceEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
} = {}) {
  const rankingEngine =
    createMorphologyRankingEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
    });

  const confidenceEngine =
    new ConfidenceEngine({
      policy:
        confidencePolicy,
    });

  return {
    rankingEngine,
    confidenceEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const ranked =
        rankingEngine.rankFeatures(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const confidence =
        confidenceEngine.calculate(
          ranked.ranking,
        );

      return {
        specimenType:
          specimenType || null,
        ranked,
        confidence,
      };
    },
  };
}
