import {
  MorphologyKnowledgeRegistry,
} from "../registry/index.js";

import {
  foundationMorphologyCatalog,
} from "./foundationCatalog.js";

export function createFoundationMorphologyRegistry() {
  const registry =
    new MorphologyKnowledgeRegistry();

  registry.registerMany(
    foundationMorphologyCatalog,
  );

  return registry;
}
