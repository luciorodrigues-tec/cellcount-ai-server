import {
  createDifferentialSimilarityEngine,
} from "../similarityCalculator/index.js";

import {
  DifferentialEvidenceEngine,
} from "./DifferentialEvidenceEngine.js";

export function createDifferentialEvidenceEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
  graphPolicy = {},
  pairPolicy = {},
  similarityPolicy = {},
  evidencePolicy = {},
} = {}) {
  const similarityEngine =
    createDifferentialSimilarityEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
      graphPolicy,
      pairPolicy,
      similarityPolicy,
    });

  const evidenceEngine =
    new DifferentialEvidenceEngine({
      policy:
        evidencePolicy,
    });

  return {
    similarityEngine,
    evidenceEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const similarityAnalysis =
        similarityEngine.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const evidence =
        evidenceEngine.analyzeMany({
          similarityResults:
            similarityAnalysis
              .similarities,
          detectedFeatures,
        });

      return {
        specimenType:
          specimenType || null,
        similarityAnalysis,
        evidence,
      };
    },
  };
}
