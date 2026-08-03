export class HematologyKnowledgePackInstaller {
  constructor({
    repository,
    loader,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "HematologyKnowledgePackInstaller requires a diagnostic knowledge repository.",
      );
    }

    if (!loader) {
      throw new TypeError(
        "HematologyKnowledgePackInstaller requires a loader.",
      );
    }

    this.repository = repository;
    this.loader = loader;
  }

  install({ commit = false } = {}) {
    const pack = this.loader.load();

    if (!commit) {
      return Object.freeze({
        status: "VALIDATED",
        committed: false,
        classificationCount:
          pack.classifications.length,
        entityCount: pack.entities.length,
        pack,
      });
    }

    for (const classification of pack.classifications) {
      this.repository.registerClassification(
        classification,
      );
    }

    for (const entity of pack.entities) {
      this.repository.registerEntity(entity);
    }

    return Object.freeze({
      status: "COMMITTED",
      committed: true,
      classificationCount:
        pack.classifications.length,
      entityCount: pack.entities.length,
      pack,
    });
  }
}
