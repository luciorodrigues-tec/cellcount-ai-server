import {
  DiagnosticHypothesisRankingEngine,
} from "./application/DiagnosticHypothesisRankingEngine.js";

import {
  RankingHypothesisRepository,
} from "./repository/RankingHypothesisRepository.js";

export function createDiagnosticHypothesisRankingLibrary({
  hypotheses = [],
  policy = {},
} = {}) {
  const hypothesisRepository =
    new RankingHypothesisRepository();

  for (const hypothesis of hypotheses) {
    hypothesisRepository.register(
      hypothesis,
    );
  }

  return Object.freeze({
    hypothesisRepository,
    engine:
      new DiagnosticHypothesisRankingEngine({
        hypothesisRepository,
        policy,
      }),
    hypotheses:
      hypothesisRepository.list(),
  });
}
