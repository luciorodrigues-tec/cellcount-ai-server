import {
  mergeMorphologicPatternPolicy,
} from "./domain/MorphologicPatternPolicy.js";

import {
  MorphologicPatternKnowledgeRepository,
} from "./repository/MorphologicPatternKnowledgeRepository.js";

import {
  MorphologicPatternRecognitionKnowledgeEngine,
} from "./application/MorphologicPatternRecognitionKnowledgeEngine.js";

export function createMorphologicPatternRecognitionLibrary({
  patterns = [],
  relations = [],
  policy = {},
} = {}) {
  const normalizedPolicy =
    mergeMorphologicPatternPolicy(policy);

  const repository =
    new MorphologicPatternKnowledgeRepository({
      policy: normalizedPolicy,
    });

  for (const pattern of patterns) {
    repository.registerPattern(pattern);
  }

  for (const relation of relations) {
    repository.registerRelation(relation);
  }

  const engine =
    new MorphologicPatternRecognitionKnowledgeEngine({
      repository,
      policy: normalizedPolicy,
    });

  if (
    normalizedPolicy.rejectHierarchyCycles &&
    engine.detectHierarchyCycle()
  ) {
    throw new Error(
      "Morphologic pattern hierarchy cycle detected.",
    );
  }

  return Object.freeze({
    repository,
    engine,
    patterns:
      repository.listPatterns(),
    relations:
      repository.listRelations(),
  });
}
