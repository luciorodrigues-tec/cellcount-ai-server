import {
  assertValidMorphologyKnowledgeEntity,
} from "../validation/MorphologyKnowledgeValidator.js";

export const MORPHOLOGY_KNOWLEDGE_REGISTRY_VERSION =
  "CI-002A-v1";

export class MorphologyKnowledgeRegistry {
  constructor({
    version =
      MORPHOLOGY_KNOWLEDGE_REGISTRY_VERSION,
  } = {}) {
    this.version = version;
    this._entities = new Map();
  }

  register(entity, {
    replace = false,
  } = {}) {
    assertValidMorphologyKnowledgeEntity(entity);

    if (
      this._entities.has(entity.id) &&
      !replace
    ) {
      throw new Error(
        `Knowledge entity already registered: ${entity.id}`,
      );
    }

    this._entities.set(entity.id, entity);

    return entity;
  }

  registerMany(entities = [], options = {}) {
    return entities.map(
      (entity) => this.register(entity, options),
    );
  }

  get(id) {
    return this._entities.get(id) || null;
  }

  has(id) {
    return this._entities.has(id);
  }

  remove(id) {
    return this._entities.delete(id);
  }

  list({
    kind,
    specimenType,
    lineage,
    status,
    tag,
  } = {}) {
    return [...this._entities.values()]
      .filter(
        (entity) =>
          !kind ||
          entity.kind === kind,
      )
      .filter(
        (entity) =>
          !specimenType ||
          entity.specimenTypes.includes(
            specimenType,
          ),
      )
      .filter(
        (entity) =>
          !lineage ||
          entity.lineage === lineage,
      )
      .filter(
        (entity) =>
          !status ||
          entity.status === status,
      )
      .filter(
        (entity) =>
          !tag ||
          entity.tags.includes(tag),
      );
  }

  search(query = "") {
    const normalized =
      String(query).trim().toLowerCase();

    if (!normalized) {
      return this.list();
    }

    return this.list().filter((entity) => {
      const haystack = [
        entity.id,
        entity.displayName,
        entity.definition,
        entity.lineage,
        ...(entity.aliases || []),
        ...(entity.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }

  snapshot() {
    return Object.freeze({
      version: this.version,
      size: this._entities.size,
      entities: Object.freeze(
        [...this._entities.values()],
      ),
    });
  }

  clear() {
    this._entities.clear();
  }
}
