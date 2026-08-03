import {
  mergeHematologicDiseaseKnowledgePolicy,
} from "./domain/HematologicDiseaseKnowledgePolicy.js";

import {
  HematologicDiseaseKnowledgeRepository,
} from "./repository/HematologicDiseaseKnowledgeRepository.js";

import {
  HematologicDiseaseKnowledgeEngine,
} from "./application/HematologicDiseaseKnowledgeEngine.js";

export function createHematologicDiseaseKnowledgeLibrary({
  diseases = [],
  relations = [],
  policy = {},
} = {}) {
  const normalizedPolicy =
    mergeHematologicDiseaseKnowledgePolicy(policy);

  const repository =
    new HematologicDiseaseKnowledgeRepository({
      policy: normalizedPolicy,
    });

  for (const disease of diseases) {
    repository.registerDisease(disease);
  }

  for (const relation of relations) {
    repository.registerRelation(relation);
  }

  const engine =
    new HematologicDiseaseKnowledgeEngine({
      repository,
      policy: normalizedPolicy,
    });

  if (
    normalizedPolicy.rejectHierarchyCycles &&
    engine.detectHierarchyCycle()
  ) {
    throw new Error(
      "Hematologic disease hierarchy cycle detected.",
    );
  }

  return Object.freeze({
    repository,
    engine,
    diseases:
      repository.listDiseases(),
    relations:
      repository.listRelations(),
  });
}
