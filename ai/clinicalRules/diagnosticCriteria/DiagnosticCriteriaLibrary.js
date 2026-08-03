import {
  DiagnosticCriteriaRepository,
} from "./repository/DiagnosticCriteriaRepository.js";

import {
  DiagnosticCriteriaEngine,
} from "./application/DiagnosticCriteriaEngine.js";

export function createDiagnosticCriteriaLibrary({
  criteria = [],
  sets = [],
  policy = {},
} = {}) {
  const repository =
    new DiagnosticCriteriaRepository();

  for (const criterion of criteria) {
    repository.registerCriterion(criterion);
  }

  for (const criteriaSet of sets) {
    repository.registerSet(criteriaSet);
  }

  return Object.freeze({
    repository,
    engine:
      new DiagnosticCriteriaEngine({
        repository,
        policy,
      }),
    criteria:
      repository.listCriteria(),
    sets:
      repository.listSets(),
  });
}
