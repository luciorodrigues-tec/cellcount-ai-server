import {
  mergeMedicalKnowledgeGraphPolicy,
} from "./domain/MedicalKnowledgeGraphPolicy.js";

import {
  MedicalKnowledgeGraphRepository,
} from "./repository/MedicalKnowledgeGraphRepository.js";

import {
  MedicalKnowledgeGraphEngine,
} from "./application/MedicalKnowledgeGraphEngine.js";

import {
  DiseaseOntologyEngine,
} from "./application/DiseaseOntologyEngine.js";

export function createMedicalKnowledgeGraphLibrary({
  entities = [],
  relations = [],
  policy = {},
} = {}) {
  const normalizedPolicy =
    mergeMedicalKnowledgeGraphPolicy(
      policy,
    );

  const repository =
    new MedicalKnowledgeGraphRepository({
      policy: normalizedPolicy,
    });

  for (const entity of entities) {
    repository.registerEntity(entity);
  }

  for (const relation of relations) {
    repository.registerRelation(relation);
  }

  const graphEngine =
    new MedicalKnowledgeGraphEngine({
      repository,
      policy: normalizedPolicy,
    });

  const diseaseOntologyEngine =
    new DiseaseOntologyEngine({
      graphEngine,
    });

  return Object.freeze({
    repository,
    graphEngine,
    diseaseOntologyEngine,
    entities:
      repository.listEntities(),
    relations:
      repository.listRelations(),
  });
}
