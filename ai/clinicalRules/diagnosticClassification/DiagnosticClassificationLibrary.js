import {
  DiagnosticClassificationRepository,
} from "./repository/DiagnosticClassificationRepository.js";

import {
  DiagnosticClassificationEngine,
} from "./application/DiagnosticClassificationEngine.js";

export function createDiagnosticClassificationLibrary({
  candidates = [],
  criteriaEngine,
  policy = {},
} = {}) {
  const repository =
    new DiagnosticClassificationRepository();

  for (const candidate of candidates) {
    repository.registerCandidate(
      candidate,
    );
  }

  return Object.freeze({
    repository,
    engine:
      new DiagnosticClassificationEngine({
        repository,
        criteriaEngine,
        policy,
      }),
    candidates:
      repository.listCandidates(),
  });
}
