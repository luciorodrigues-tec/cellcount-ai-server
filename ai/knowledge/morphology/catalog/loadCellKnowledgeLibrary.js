import {
  MorphologyKnowledgeRegistry,
} from "../registry/index.js";

import {
  cellKnowledgeLibrary,
} from "./cellKnowledgeLibrary.js";

export function createCellKnowledgeRegistry() {
  const registry =
    new MorphologyKnowledgeRegistry({
      version: "CI-002B.1-v1",
    });

  registry.registerMany(
    cellKnowledgeLibrary,
  );

  return registry;
}
