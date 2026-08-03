import {
  createExclusiveFeatureEngine,
} from "../exclusiveFeatureEngine/index.js";

import {
  DiagnosticConflictEngine,
} from "./DiagnosticConflictEngine.js";

export function createDiagnosticConflictEngine({
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
} = {}) {
  const exclusiveFeaturePipeline =
    createExclusiveFeatureEngine({
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
    });

  const conflictEngine =
    new DiagnosticConflictEngine({
      policy:
        conflictPolicy,
    });

  return {
    exclusiveFeaturePipeline,
    conflictEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const exclusiveAnalysis =
        exclusiveFeaturePipeline
          .analyze(
            detectedFeatures,
            {
              specimenType,
            },
          );

      const conflicts =
        conflictEngine
          .analyzeMany({
            exclusiveFeatureResults:
              exclusiveAnalysis
                .exclusiveFeatures,
          });

      return {
        specimenType:
          specimenType || null,
        exclusiveAnalysis,
        conflicts,
      };
    },
  };
}
