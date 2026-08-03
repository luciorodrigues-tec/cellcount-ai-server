export const HEMATOLOGIC_SYNDROME_REPOSITORY_VERSION =
  "CRR-000027-v1.0.0";

export class HematologicSyndromeRepository {
  constructor({
    version =
      HEMATOLOGIC_SYNDROME_REPOSITORY_VERSION,
    policy = {},
  } = {}) {
    this.version = String(version);
    this.policy = policy;
    this._syndromes = new Map();
    this._relations = new Map();
  }

  registerSyndrome(syndrome, { replace = false } = {}) {
    if (this._syndromes.has(syndrome.id) && !replace) {
      throw new Error(
        `Hematologic syndrome already registered: ${syndrome.id}`,
      );
    }
    this._syndromes.set(syndrome.id, syndrome);
    return syndrome;
  }

  registerRelation(relation, { replace = false } = {}) {
    if (this._relations.has(relation.id) && !replace) {
      throw new Error(
        `Hematologic syndrome relation already registered: ${relation.id}`,
      );
    }

    if (
      this.policy.rejectUnknownRelationEndpoints !== false &&
      (
        !this._syndromes.has(relation.sourceSyndromeId) ||
        !this._syndromes.has(relation.targetSyndromeId)
      )
    ) {
      throw new Error(
        "Hematologic syndrome relation endpoints must be registered.",
      );
    }

    if (
      this.policy.allowSelfRelations === false &&
      relation.sourceSyndromeId === relation.targetSyndromeId
    ) {
      throw new Error(
        "Hematologic syndrome self relations are not allowed.",
      );
    }

    this._relations.set(relation.id, relation);
    return relation;
  }

  getSyndrome(id) {
    return this._syndromes.get(String(id)) || null;
  }

  listSyndromes({ type = null, status = null } = {}) {
    return Object.freeze(
      [...this._syndromes.values()].filter(
        (item) =>
          (!type ||
            item.type === String(type).trim().toUpperCase()) &&
          (!status ||
            item.status === String(status).trim().toUpperCase()),
      ),
    );
  }

  listRelations({ type = null } = {}) {
    return Object.freeze(
      [...this._relations.values()].filter(
        (item) =>
          !type ||
          item.type === String(type).trim().toUpperCase(),
      ),
    );
  }
}
