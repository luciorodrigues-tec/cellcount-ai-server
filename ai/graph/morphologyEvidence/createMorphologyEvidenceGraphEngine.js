import {
  createMorphologyExplanationEngine,
} from "../../explanation/morphologyExplanation/index.js";

import {
  EvidenceGraphBuilder,
} from "./EvidenceGraphBuilder.js";

import {
  EvidenceGraphQuery,
} from "./EvidenceGraphQuery.js";

export function createMorphologyEvidenceGraphEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
  graphPolicy = {},
} = {}) {
  const explanationEngine =
    createMorphologyExplanationEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
    });

  const graphBuilder =
    new EvidenceGraphBuilder({
      policy:
        graphPolicy,
    });

  return {
    explanationEngine,
    graphBuilder,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const explained =
        explanationEngine.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const graph =
        graphBuilder.build({
          explanation:
            explained.explanation,
          specimenType,
        });

      return {
        specimenType:
          specimenType || null,
        explained,
        graph,
        query:
          new EvidenceGraphQuery(
            graph,
          ),
      };
    },
  };
}
