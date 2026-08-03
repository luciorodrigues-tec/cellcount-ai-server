export const MORPHOLOGIC_ONTOLOGY_REPOSITORY_VERSION =
  "CRR-000018-v1.0.0";

export class MorphologicFeatureOntologyRepository {
  constructor({
    version =
      MORPHOLOGIC_ONTOLOGY_REPOSITORY_VERSION,
    policy = {},
  } = {}) {
    this.version = String(version);
    this.policy = policy;
    this._features = new Map();
    this._relations = new Map();
    this._synonymIndex = new Map();
  }

  registerFeature(feature, { replace = false } = {}) {
    if (
      this._features.has(feature.id) &&
      !replace
    ) {
      throw new Error(
        `Morphologic feature already registered: ${feature.id}`,
      );
    }

    if (
      feature.parentFeatureId &&
      !this._features.has(feature.parentFeatureId)
    ) {
      throw new Error(
        `Unknown parent morphologic feature: ${feature.parentFeatureId}`,
      );
    }

    this._features.set(feature.id, feature);

    const terms = [
      feature.preferredName,
      ...feature.synonyms,
      ...feature.aliases,
    ];

    for (const term of terms) {
      this._synonymIndex.set(
        term.trim().toLowerCase(),
        feature.id,
      );
    }

    return feature;
  }

  registerRelation(relation, { replace = false } = {}) {
    if (
      this._relations.has(relation.id) &&
      !replace
    ) {
      throw new Error(
        `Morphologic feature relation already registered: ${relation.id}`,
      );
    }

    if (
      this.policy.requireKnownRelationEndpoints !== false &&
      (
        !this._features.has(relation.sourceFeatureId) ||
        !this._features.has(relation.targetFeatureId)
      )
    ) {
      throw new Error(
        "Morphologic relation endpoints must be registered.",
      );
    }

    if (
      this.policy.allowSelfRelations === false &&
      relation.sourceFeatureId ===
        relation.targetFeatureId
    ) {
      throw new Error(
        "Self relations are not allowed.",
      );
    }

    this._relations.set(relation.id, relation);
    return relation;
  }

  getFeature(id) {
    return this._features.get(String(id)) || null;
  }

  getRelation(id) {
    return this._relations.get(String(id)) || null;
  }

  resolveTerm(term) {
    const id =
      this._synonymIndex.get(
        String(term).trim().toLowerCase(),
      );

    return id ? this.getFeature(id) : null;
  }

  listFeatures({
    category = null,
    lineage = null,
    status = null,
  } = {}) {
    return Object.freeze(
      [...this._features.values()].filter(
        (feature) =>
          (!category ||
            feature.category ===
              String(category).trim().toUpperCase()) &&
          (!lineage ||
            feature.lineage ===
              String(lineage).trim().toUpperCase()) &&
          (!status ||
            feature.status ===
              String(status).trim().toUpperCase()),
      ),
    );
  }

  listRelations({ type = null } = {}) {
    return Object.freeze(
      [...this._relations.values()].filter(
        (relation) =>
          !type ||
          relation.type ===
            String(type).trim().toUpperCase(),
      ),
    );
  }

  childrenOf(featureId) {
    return Object.freeze(
      [...this._features.values()].filter(
        (feature) =>
          feature.parentFeatureId ===
          String(featureId),
      ),
    );
  }
}
