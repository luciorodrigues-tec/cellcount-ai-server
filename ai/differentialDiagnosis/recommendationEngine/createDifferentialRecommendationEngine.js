import {
  createDiagnosticConflictEngine,
} from "../conflictEngine/index.js";

import {
  DifferentialRecommendationEngine,
} from "./DifferentialRecommendationEngine.js";

export function createDifferentialRecommendationEngine({
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
} = {}) {
  const conflictPipeline =
    createDiagnosticConflictEngine({
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
    });

  const recommendationEngine =
    new DifferentialRecommendationEngine({
      policy:
        recommendationPolicy,
    });

  return {
    conflictPipeline,
    recommendationEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const conflictAnalysis =
        conflictPipeline.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const recommendations =
        recommendationEngine.analyzeMany({
          conflictResults:
            conflictAnalysis
              .conflicts,
          exclusiveFeatureResults:
            conflictAnalysis
              .exclusiveAnalysis
              .exclusiveFeatures,
        });

      return {
        specimenType:
          specimenType || null,
        conflictAnalysis,
        recommendations,
      };
    },
  };
}
