import {
  createMorphologyConfidenceEngine,
} from "../../confidence/morphologyConfidence/index.js";

import {
  ExplanationEngine,
} from "./ExplanationEngine.js";

export function createMorphologyExplanationEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
} = {}) {
  const confidenceEngine =
    createMorphologyConfidenceEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
    });

  const explanationEngine =
    new ExplanationEngine({
      policy:
        explanationPolicy,
    });

  return {
    confidenceEngine,
    explanationEngine,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const confidenceAnalysis =
        confidenceEngine.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const explanation =
        explanationEngine.explain({
          rankingResult:
            confidenceAnalysis
              .ranked
              .ranking,
          confidenceResult:
            confidenceAnalysis
              .confidence,
          specimenType,
        });

      return {
        specimenType:
          specimenType || null,
        confidenceAnalysis,
        explanation,
      };
    },
  };
}
