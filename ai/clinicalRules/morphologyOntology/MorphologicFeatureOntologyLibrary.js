import {
  mergeMorphologicOntologyPolicy,
} from "./domain/MorphologicOntologyPolicy.js";

import {
  MorphologicFeatureOntologyRepository,
} from "./repository/MorphologicFeatureOntologyRepository.js";

import {
  MorphologicFeatureOntologyEngine,
} from "./application/MorphologicFeatureOntologyEngine.js";

export function createMorphologicFeatureOntologyLibrary({
  features = [],
  relations = [],
  policy = {},
} = {}) {
  const normalizedPolicy =
    mergeMorphologicOntologyPolicy(policy);

  const repository =
    new MorphologicFeatureOntologyRepository({
      policy: normalizedPolicy,
    });

  for (const feature of features) {
    repository.registerFeature(feature);
  }

  for (const relation of relations) {
    repository.registerRelation(relation);
  }

  const engine =
    new MorphologicFeatureOntologyEngine({
      repository,
      policy: normalizedPolicy,
    });

  if (
    normalizedPolicy.rejectHierarchyCycles &&
    engine.detectHierarchyCycle()
  ) {
    throw new Error(
      "Morphologic ontology hierarchy cycle detected.",
    );
  }

  return Object.freeze({
    repository,
    engine,
    features:
      repository.listFeatures(),
    relations:
      repository.listRelations(),
  });
}
