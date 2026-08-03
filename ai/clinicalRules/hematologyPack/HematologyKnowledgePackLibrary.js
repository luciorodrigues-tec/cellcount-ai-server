import {
  HematologyKnowledgePackLoader,
} from "./application/HematologyKnowledgePackLoader.js";

import {
  HematologyKnowledgePackInstaller,
} from "./application/HematologyKnowledgePackInstaller.js";

export function createHematologyKnowledgePackLibrary({
  repository,
} = {}) {
  const loader =
    new HematologyKnowledgePackLoader();

  return Object.freeze({
    loader,
    installer:
      repository
        ? new HematologyKnowledgePackInstaller({
            repository,
            loader,
          })
        : null,
  });
}
