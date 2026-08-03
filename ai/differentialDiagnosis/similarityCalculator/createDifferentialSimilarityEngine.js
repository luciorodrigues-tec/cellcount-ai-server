import {
  createDifferentialPairBuilderEngine,
} from "../pairBuilder/index.js";

import {
  DifferentialSimilarityCalculator,
} from "./DifferentialSimilarityCalculator.js";

export function createDifferentialSimilarityEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
  graphPolicy = {},
  pairPolicy = {},
  similarityPolicy = {},
} = {}) {
  const pairBuilderEngine =
    createDifferentialPairBuilderEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
      graphPolicy,
      pairPolicy,
    });

  const calculator =
    new DifferentialSimilarityCalculator({
      policy:
        similarityPolicy,
    });

  return {
    pairBuilderEngine,
    calculator,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const pairAnalysis =
        pairBuilderEngine.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const confidenceResult =
        pairAnalysis
          .graphAnalysis
          .explained
          .explanation
          .confidence;

      const similarities =
        calculator.calculateMany({
          pairs:
            pairAnalysis
              .pairs
              .eligiblePairs,
          detectedFeatures,
          confidenceResult,
          specimenType,
        });

      return {
        specimenType:
          specimenType || null,
        pairAnalysis,
        similarities,
      };
    },
  };
}
