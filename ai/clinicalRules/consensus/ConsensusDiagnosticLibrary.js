import {
  ConsensusDiagnosticEngine,
} from "./application/ConsensusDiagnosticEngine.js";

import {
  DiagnosticHypothesisRepository,
} from "./repository/DiagnosticHypothesisRepository.js";

export function createConsensusDiagnosticLibrary({
  hypotheses = [],
  policy = {},
} = {}) {
  const hypothesisRepository =
    new DiagnosticHypothesisRepository();

  for (const hypothesis of hypotheses) {
    hypothesisRepository.register(
      hypothesis,
    );
  }

  const engine =
    new ConsensusDiagnosticEngine({
      hypothesisRepository,
      policy,
    });

  return Object.freeze({
    hypothesisRepository,
    engine,
    hypotheses:
      hypothesisRepository.list(),
  });
}
