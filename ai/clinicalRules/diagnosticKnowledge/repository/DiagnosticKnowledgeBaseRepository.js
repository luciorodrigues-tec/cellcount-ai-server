export const DIAGNOSTIC_KNOWLEDGE_BASE_REPOSITORY_VERSION =
  "CRR-000015-v1.0.0";

export class DiagnosticKnowledgeBaseRepository {
  constructor({
    version =
      DIAGNOSTIC_KNOWLEDGE_BASE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._classifications = new Map();
    this._entities = new Map();
    this._byClassification = new Map();
  }

  registerClassification(
    classification,
    { replace = false } = {},
  ) {
    if (
      this._classifications.has(classification.id) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic classification already registered: ${classification.id}`,
      );
    }

    this._classifications.set(
      classification.id,
      classification,
    );
    return classification;
  }

  registerEntity(entity, { replace = false } = {}) {
    if (
      !this._classifications.has(
        entity.classificationId,
      )
    ) {
      throw new Error(
        `Unknown diagnostic classification: ${entity.classificationId}`,
      );
    }

    if (
      this._entities.has(entity.id) &&
      !replace
    ) {
      throw new Error(
        `Diagnostic knowledge entity already registered: ${entity.id}`,
      );
    }

    if (
      entity.parentEntityId &&
      !this._entities.has(entity.parentEntityId)
    ) {
      throw new Error(
        `Unknown parent diagnostic entity: ${entity.parentEntityId}`,
      );
    }

    this._entities.set(entity.id, entity);

    const ids =
      this._byClassification.get(
        entity.classificationId,
      ) || [];

    if (!ids.includes(entity.id)) {
      ids.push(entity.id);
    }

    this._byClassification.set(
      entity.classificationId,
      ids,
    );

    return entity;
  }

  getClassification(id) {
    return (
      this._classifications.get(String(id)) ||
      null
    );
  }

  getEntity(id) {
    return this._entities.get(String(id)) || null;
  }

  listClassifications({ family = null } = {}) {
    return Object.freeze(
      [...this._classifications.values()].filter(
        (item) =>
          !family ||
          item.family ===
            String(family).trim().toUpperCase(),
      ),
    );
  }

  listEntities({
    classificationId = null,
    type = null,
  } = {}) {
    let values = [...this._entities.values()];

    if (classificationId) {
      values = values.filter(
        (item) =>
          item.classificationId ===
          String(classificationId),
      );
    }

    if (type) {
      values = values.filter(
        (item) =>
          item.type ===
          String(type).trim().toUpperCase(),
      );
    }

    return Object.freeze(values);
  }

  childrenOf(entityId) {
    return Object.freeze(
      [...this._entities.values()].filter(
        (item) =>
          item.parentEntityId ===
          String(entityId),
      ),
    );
  }
}
