import {
  DiagnosticKnowledgeBaseRepository,
} from "./repository/DiagnosticKnowledgeBaseRepository.js";

import {
  DiagnosticKnowledgeBaseEngine,
} from "./application/DiagnosticKnowledgeBaseEngine.js";

export function createDiagnosticKnowledgeBaseLibrary({
  classifications = [],
  entities = [],
} = {}) {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  for (const classification of classifications) {
    repository.registerClassification(
      classification,
    );
  }

  for (const entity of entities) {
    repository.registerEntity(entity);
  }

  return Object.freeze({
    repository,
    engine:
      new DiagnosticKnowledgeBaseEngine({
        repository,
      }),
    classifications:
      repository.listClassifications(),
    entities:
      repository.listEntities(),
  });
}
