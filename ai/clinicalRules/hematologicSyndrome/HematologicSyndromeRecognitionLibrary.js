import {
  mergeHematologicSyndromePolicy,
} from "./domain/HematologicSyndromePolicy.js";

import {
  HematologicSyndromeRepository,
} from "./repository/HematologicSyndromeRepository.js";

import {
  HematologicSyndromeRecognitionEngine,
} from "./application/HematologicSyndromeRecognitionEngine.js";

export function createHematologicSyndromeRecognitionLibrary({
  syndromes = [],
  relations = [],
  policy = {},
} = {}) {
  const normalizedPolicy =
    mergeHematologicSyndromePolicy(policy);

  const repository =
    new HematologicSyndromeRepository({
      policy: normalizedPolicy,
    });

  for (const syndrome of syndromes) {
    repository.registerSyndrome(syndrome);
  }

  for (const relation of relations) {
    repository.registerRelation(relation);
  }

  return Object.freeze({
    repository,
    engine:
      new HematologicSyndromeRecognitionEngine({
        repository,
        policy: normalizedPolicy,
      }),
    syndromes:
      repository.listSyndromes(),
    relations:
      repository.listRelations(),
  });
}
