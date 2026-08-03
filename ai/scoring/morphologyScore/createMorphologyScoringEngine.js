import {
  createFeatureMatcher,
} from "../../matching/featureMatcher/index.js";

import {
  ScoreCalculator,
} from "./ScoreCalculator.js";

export function createMorphologyScoringEngine({
  scorePolicy = {},
} = {}) {
  const featureMatching =
    createFeatureMatcher();

  const calculator =
    new ScoreCalculator({
      policy: scorePolicy,
    });

  return {
    matcher:
      featureMatching.matcher,
    criteriaEngine:
      featureMatching.criteriaEngine,
    aliasRegistry:
      featureMatching.aliasRegistry,
    similarityEngine:
      featureMatching.similarityEngine,
    calculator,

    score(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const matches =
        featureMatching.matcher
          .match(
            detectedFeatures,
            {
              specimenType,
            },
          );

      const scores =
        calculator.calculateMany(
          matches,
          featureMatching
            .criteriaEngine
            .criteriaRegistry,
        );

      return {
        specimenType:
          specimenType || null,
        matches,
        scores,
      };
    },
  };
}
