import {
  createMorphologyScoringEngine,
} from "../../scoring/morphologyScore/index.js";

import {
  CandidateGenerator,
} from "./CandidateGenerator.js";

export function createMorphologyCandidateEngine({
  scorePolicy = {},
  candidateThresholds = {},
} = {}) {
  const scoringEngine =
    createMorphologyScoringEngine({
      scorePolicy,
    });

  const generator =
    new CandidateGenerator({
      thresholds:
        candidateThresholds,
    });

  return {
    scoringEngine,
    generator,

    generate(
      detectedFeatures,
      {
        specimenType,
      } = {},
    ) {
      const scoring =
        scoringEngine.score(
          detectedFeatures,
          {
            specimenType,
          },
        );

      const candidates =
        generator.generate(
          scoring.scores,
          {
            specimenType,
          },
        );

      return {
        specimenType:
          specimenType || null,
        scoring,
        candidates,
      };
    },
  };
}
