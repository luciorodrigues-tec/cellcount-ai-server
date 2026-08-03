import {
  StructuredClassificationImportAdapter,
} from "./adapters/StructuredClassificationImportAdapter.js";

import {
  WhoIccElnKnowledgePopulationEngine,
} from "./application/WhoIccElnKnowledgePopulationEngine.js";

export function createKnowledgePopulationLibrary({
  repository,
  policy = {},
} = {}) {
  return Object.freeze({
    importAdapter:
      new StructuredClassificationImportAdapter(),
    engine:
      new WhoIccElnKnowledgePopulationEngine({
        repository,
        policy,
      }),
  });
}
