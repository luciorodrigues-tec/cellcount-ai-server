import {
  GuidelineVersionManager,
} from "./application/GuidelineVersionManager.js";

import {
  GuidelineVersionRepository,
} from "./repository/GuidelineVersionRepository.js";

export function createGuidelineVersionLibrary({
  guidelines = [],
  bindings = [],
  governanceEngine = null,
} = {}) {
  const repository =
    new GuidelineVersionRepository();

  for (const guideline of guidelines) {
    repository.registerGuideline(guideline);
  }

  for (const binding of bindings) {
    repository.registerBinding(binding);
  }

  const manager = new GuidelineVersionManager({
    repository,
    governanceEngine,
  });

  return Object.freeze({
    repository,
    manager,
    guidelines: repository.listGuidelines(),
  });
}
