import {
  createCellKnowledgeRegistry,
} from "../../knowledge/morphology/index.js";

import {
  createFeatureReferenceCatalogFromCells,
} from "../../knowledge/morphology/criteria/FeatureReferenceCatalog.js";

import {
  cellKnowledgeLibrary,
} from "../../knowledge/morphology/catalog/cellKnowledgeLibrary.js";

import {
  DifferentialRuleRepository,
} from "./DifferentialRuleRepository.js";

import {
  coreDifferentialRules,
} from "./rules/coreDifferentialRules.js";

export function createDifferentialRuleLibrary() {
  const cellRegistry =
    createCellKnowledgeRegistry();

  const featureCatalog =
    createFeatureReferenceCatalogFromCells(
      cellKnowledgeLibrary,
    );

  const repository =
    new DifferentialRuleRepository({
      cellRegistry,
      featureCatalog,
    });

  repository.registerMany(
    coreDifferentialRules,
  );

  return {
    cellRegistry,
    featureCatalog,
    repository,
  };
}
