import {
  createDifferentialRecommendationEngine,
} from "../recommendationEngine/index.js";

import {
  FinalDifferentialDiagnosisEngine,
} from "./FinalDifferentialDiagnosisEngine.js";

export function createFinalDifferentialDiagnosisEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
  graphPolicy = {},
  pairPolicy = {},
  similarityPolicy = {},
  evidencePolicy = {},
  exclusiveFeaturePolicy = {},
  conflictPolicy = {},
  recommendationPolicy = {},
  finalDiagnosisPolicy = {},
} = {}) {
  const recommendationPipeline =
    createDifferentialRecommendationEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
      graphPolicy,
      pairPolicy,
      similarityPolicy,
      evidencePolicy,
      exclusiveFeaturePolicy,
      conflictPolicy,
      recommendationPolicy,
    });

  const finalEngine =
    new FinalDifferentialDiagnosisEngine({
      policy:
        finalDiagnosisPolicy,
    });

  return {
    recommendationPipeline,
    finalEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const started =
        Date.now();

      const recommendationAnalysis =
        recommendationPipeline.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      return finalEngine.analyze({
        recommendationAnalysis,
        executionTimeMs:
          Date.now() - started,
      });
    },
  };
}
