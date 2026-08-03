import {
  cellKnowledgeLibrary,
  createCellKnowledgeRegistry,
} from "../index.js";

import {
  createFeatureReferenceCatalogFromCells,
} from "./FeatureReferenceCatalog.js";

import {
  cellCriteriaDefinitions,
} from "./definitions/cellCriteriaDefinitions.js";

import {
  CriteriaRegistry,
} from "./registry/CriteriaRegistry.js";

export function createCriteriaEngineRegistry() {
  const cellRegistry =
    createCellKnowledgeRegistry();

  const featureCatalog =
    createFeatureReferenceCatalogFromCells(
      cellKnowledgeLibrary,
    );

  const criteriaRegistry =
    new CriteriaRegistry({
      cellRegistry,
      featureCatalog,
    });

  criteriaRegistry.registerMany(
    cellCriteriaDefinitions,
  );

  return {
    cellRegistry,
    featureCatalog,
    criteriaRegistry,
  };
}
