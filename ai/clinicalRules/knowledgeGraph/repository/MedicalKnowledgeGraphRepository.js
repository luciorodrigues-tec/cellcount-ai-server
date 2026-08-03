export const MEDICAL_KNOWLEDGE_GRAPH_REPOSITORY_VERSION =
  "CRR-000014-v1.0.0";

export class MedicalKnowledgeGraphRepository {
  constructor({
    version =
      MEDICAL_KNOWLEDGE_GRAPH_REPOSITORY_VERSION,
    policy = {},
  } = {}) {
    this.version = String(version);
    this.policy = policy;
    this._entities = new Map();
    this._relations = new Map();
    this._outgoing = new Map();
    this._incoming = new Map();
  }

  registerEntity(entity, { replace = false } = {}) {
    if (!entity?.id) {
      throw new TypeError(
        "Medical knowledge entity with id is required.",
      );
    }

    if (this._entities.has(entity.id) && !replace) {
      throw new Error(
        `Medical knowledge entity already registered: ${entity.id}`,
      );
    }

    this._entities.set(entity.id, entity);
    return entity;
  }

  registerRelation(relation, { replace = false } = {}) {
    if (!relation?.id) {
      throw new TypeError(
        "Medical knowledge relation with id is required.",
      );
    }

    if (
      this._relations.has(relation.id) &&
      !replace
    ) {
      throw new Error(
        `Medical knowledge relation already registered: ${relation.id}`,
      );
    }

    if (
      this.policy?.requireKnownRelationEndpoints !== false &&
      (
        !this._entities.has(relation.sourceEntityId) ||
        !this._entities.has(relation.targetEntityId)
      )
    ) {
      throw new Error(
        "Medical knowledge relation endpoints must be registered.",
      );
    }

    if (
      this.policy?.allowSelfRelations === false &&
      relation.sourceEntityId ===
        relation.targetEntityId
    ) {
      throw new Error(
        "Self relations are not allowed.",
      );
    }

    this._relations.set(relation.id, relation);

    const outgoing =
      this._outgoing.get(
        relation.sourceEntityId,
      ) || [];
    if (!outgoing.includes(relation.id)) {
      outgoing.push(relation.id);
    }
    this._outgoing.set(
      relation.sourceEntityId,
      outgoing,
    );

    const incoming =
      this._incoming.get(
        relation.targetEntityId,
      ) || [];
    if (!incoming.includes(relation.id)) {
      incoming.push(relation.id);
    }
    this._incoming.set(
      relation.targetEntityId,
      incoming,
    );

    return relation;
  }

  getEntity(id) {
    return this._entities.get(String(id)) || null;
  }

  getRelation(id) {
    return this._relations.get(String(id)) || null;
  }

  listEntities({ type = null, status = null } = {}) {
    return Object.freeze(
      [...this._entities.values()].filter(
        (entity) =>
          (!type ||
            entity.type ===
              String(type).trim().toUpperCase()) &&
          (!status ||
            entity.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }

  listRelations({
    type = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._relations.values()].filter(
        (relation) =>
          (!type ||
            relation.type ===
              String(type).trim().toUpperCase()) &&
          (!status ||
            relation.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }

  outgoingRelations(entityId) {
    return Object.freeze(
      (this._outgoing.get(String(entityId)) || [])
        .map((id) => this.getRelation(id))
        .filter(Boolean),
    );
  }

  incomingRelations(entityId) {
    return Object.freeze(
      (this._incoming.get(String(entityId)) || [])
        .map((id) => this.getRelation(id))
        .filter(Boolean),
    );
  }
}
