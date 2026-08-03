import {
  createCriteriaEngineRegistry,
} from "../../knowledge/morphology/index.js";

import {
  createDefaultFeatureAliasRegistry,
} from "./FeatureAliasRegistry.js";

import {
  createDefaultFeatureSimilarity,
} from "./FeatureSimilarity.js";

import {
  FeatureMatcher,
} from "./FeatureMatcher.js";

export function createFeatureMatcher() {
  const criteriaEngine =
    createCriteriaEngineRegistry();

  const aliasRegistry =
    createDefaultFeatureAliasRegistry();

  for (
    const featureId
    of criteriaEngine
      .featureCatalog
      .list()
  ) {
    aliasRegistry
      .registerCanonical(featureId);
  }

  const similarityEngine =
    createDefaultFeatureSimilarity(
      aliasRegistry,
    );

  return {
    matcher:
      new FeatureMatcher({
        criteriaRegistry:
          criteriaEngine
            .criteriaRegistry,
        aliasRegistry,
        similarityEngine,
      }),
    criteriaEngine,
    aliasRegistry,
    similarityEngine,
  };
}
