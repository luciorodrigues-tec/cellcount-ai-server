export const HEMATOLOGIC_DISEASE_KNOWLEDGE_REPOSITORY_VERSION =
  "CRR-000025-v1.0.0";

export class HematologicDiseaseKnowledgeRepository {
  constructor({
    version =
      HEMATOLOGIC_DISEASE_KNOWLEDGE_REPOSITORY_VERSION,
    policy = {},
  } = {}) {
    this.version = String(version);
    this.policy = policy;
    this._diseases = new Map();
    this._relations = new Map();
    this._aliasIndex = new Map();
  }

  registerDisease(disease, { replace = false } = {}) {
    if (
      this._diseases.has(disease.id) &&
      !replace
    ) {
      throw new Error(
        `Hematologic disease already registered: ${disease.id}`,
      );
    }

    if (
      disease.parentDiseaseId &&
      this.policy.rejectUnknownParents !== false &&
      !this._diseases.has(disease.parentDiseaseId)
    ) {
      throw new Error(
        `Unknown parent hematologic disease: ${disease.parentDiseaseId}`,
      );
    }

    this._diseases.set(disease.id, disease);

    for (const term of [
      disease.preferredName,
      ...disease.aliases,
    ]) {
      this._aliasIndex.set(
        String(term).trim().toLowerCase(),
        disease.id,
      );
    }

    return disease;
  }

  registerRelation(relation, { replace = false } = {}) {
    if (
      this._relations.has(relation.id) &&
      !replace
    ) {
      throw new Error(
        `Hematologic disease relation already registered: ${relation.id}`,
      );
    }

    if (
      this.policy.rejectUnknownDiseaseRelationSources !== false &&
      !this._diseases.has(relation.sourceDiseaseId)
    ) {
      throw new Error(
        `Unknown source hematologic disease: ${relation.sourceDiseaseId}`,
      );
    }

    this._relations.set(relation.id, relation);
    return relation;
  }

  getDisease(id) {
    return this._diseases.get(String(id)) || null;
  }

  resolveTerm(term) {
    const id = this._aliasIndex.get(
      String(term).trim().toLowerCase(),
    );
    return id ? this.getDisease(id) : null;
  }

  listDiseases({
    family = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._diseases.values()].filter(
        (item) =>
          (!family ||
            item.family ===
              String(family).trim().toUpperCase()) &&
          (!status ||
            item.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }

  listRelations({ type = null } = {}) {
    return Object.freeze(
      [...this._relations.values()].filter(
        (item) =>
          !type ||
          item.type ===
            String(type).trim().toUpperCase(),
      ),
    );
  }

  childrenOf(diseaseId) {
    return Object.freeze(
      [...this._diseases.values()].filter(
        (item) =>
          item.parentDiseaseId ===
          String(diseaseId),
      ),
    );
  }
}
