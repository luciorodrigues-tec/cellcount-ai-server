import {
  createMorphologyEvidenceGraphEngine,
} from "../../graph/morphologyEvidence/index.js";

import {
  createDifferentialRuleLibrary,
} from "../ruleLibrary/index.js";

import {
  DifferentialPairBuilder,
} from "./DifferentialPairBuilder.js";

export function createDifferentialPairBuilderEngine({
  scorePolicy = {},
  candidateThresholds = {},
  rankingPolicy = {},
  confidencePolicy = {},
  explanationPolicy = {},
  graphPolicy = {},
  pairPolicy = {},
} = {}) {
  const evidenceGraphEngine =
    createMorphologyEvidenceGraphEngine({
      scorePolicy,
      candidateThresholds,
      rankingPolicy,
      confidencePolicy,
      explanationPolicy,
      graphPolicy,
    });

  const ruleLibrary =
    createDifferentialRuleLibrary();

  const pairBuilder =
    new DifferentialPairBuilder({
      ruleRepository:
        ruleLibrary.repository,
      policy:
        pairPolicy,
    });

  return {
    evidenceGraphEngine,
    ruleLibrary,
    pairBuilder,

    analyze(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const graphAnalysis =
        evidenceGraphEngine.analyze(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const pairs =
        pairBuilder.build({
          explanation:
            graphAnalysis
              .explained
              .explanation,
          specimenType,
        });

      return {
        specimenType:
          specimenType || null,
        graphAnalysis,
        pairs,
      };
    },
  };
}
