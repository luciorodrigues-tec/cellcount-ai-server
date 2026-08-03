import {
  createUnspecifiedEvidenceBindings,
} from "./application/DefaultEvidenceCatalog.js";

import {
  RuleEvidenceEngine,
} from "./application/RuleEvidenceEngine.js";

import {
  RuleEvidenceRepository,
} from "./repository/RuleEvidenceRepository.js";

export function createRuleEvidenceLibrary({
  rules = [],
  sources = [],
  bindings = null,
} = {}) {
  const repository = new RuleEvidenceRepository();

  for (const source of sources) {
    repository.registerSource(source);
  }

  const effectiveBindings =
    bindings ||
    createUnspecifiedEvidenceBindings(rules);

  for (const binding of effectiveBindings) {
    repository.registerBinding(binding);
  }

  const engine = new RuleEvidenceEngine({
    repository,
  });

  return Object.freeze({
    repository,
    engine,
    sources: repository.listSources({
      activeOnly: false,
    }),
    bindings: repository.listBindings({
      activeOnly: false,
    }),
    coverage: engine.buildCoverageReport(rules),
  });
}
