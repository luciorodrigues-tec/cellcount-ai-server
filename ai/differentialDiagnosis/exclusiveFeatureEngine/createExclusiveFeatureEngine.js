import {
  createDifferentialEvidenceEngine,
} from "../evidenceEngine/index.js";

import {
  ExclusiveFeatureEngine,
} from "./ExclusiveFeatureEngine.js";

export function createExclusiveFeatureEngine({
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
} = {}) {
  const differentialEvidenceEngine =
    createDifferentialEvidenceEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
      graphPolicy,
      pairPolicy,
      similarityPolicy,
      evidencePolicy,
    });

  const exclusiveFeatureEngine =
    new ExclusiveFeatureEngine({
      policy:
        exclusiveFeaturePolicy,
    });

  return {
    differentialEvidenceEngine,
    exclusiveFeatureEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const evidenceAnalysis =
        differentialEvidenceEngine
          .analyze(
            detectedFeatures,
            {
              specimenType,
            },
          );

      const exclusiveFeatures =
        exclusiveFeatureEngine
          .analyzeMany({
            evidenceResults:
              evidenceAnalysis
                .evidence,
          });

      return {
        specimenType:
          specimenType || null,
        evidenceAnalysis,
        exclusiveFeatures,
      };
    },
  };
}
