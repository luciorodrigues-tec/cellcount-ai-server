export const MORPHOLOGIC_FEATURE_ONTOLOGY_ENGINE_VERSION =
  "CRR-000018-v1.0.0";

export class MorphologicFeatureOntologyEngine {
  constructor({
    repository,
    policy,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "MorphologicFeatureOntologyEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = policy;
  }

  resolve(termOrId) {
    return (
      this.repository.getFeature(termOrId) ||
      this.repository.resolveTerm(termOrId)
    );
  }

  hierarchy(featureId) {
    const feature =
      this.repository.getFeature(featureId);

    if (!feature) {
      throw new Error(
        `Unknown morphologic feature: ${featureId}`,
      );
    }

    const ancestors = [];
    const visited = new Set();
    let current = feature;

    while (
      current?.parentFeatureId &&
      !visited.has(current.id)
    ) {
      visited.add(current.id);
      const parent =
        this.repository.getFeature(
          current.parentFeatureId,
        );

      if (!parent) {
        break;
      }

      ancestors.push(parent);
      current = parent;
    }

    return Object.freeze({
      feature,
      ancestors: Object.freeze(ancestors),
      children:
        this.repository.childrenOf(featureId),
    });
  }

  relatedFeatures(
    featureId,
    {
      relationTypes = [],
    } = {},
  ) {
    const feature =
      this.repository.getFeature(featureId);

    if (!feature) {
      throw new Error(
        `Unknown morphologic feature: ${featureId}`,
      );
    }

    const allowed = new Set(
      (Array.isArray(relationTypes)
        ? relationTypes
        : []
      ).map((value) =>
        String(value).trim().toUpperCase(),
      ),
    );

    const relations =
      this.repository.listRelations().filter(
        (relation) =>
          (
            relation.sourceFeatureId === featureId ||
            relation.targetFeatureId === featureId
          ) &&
          (
            allowed.size === 0 ||
            allowed.has(relation.type)
          ),
      );

    return Object.freeze(
      relations.map((relation) => {
        const relatedId =
          relation.sourceFeatureId === featureId
            ? relation.targetFeatureId
            : relation.sourceFeatureId;

        return Object.freeze({
          relation,
          feature:
            this.repository.getFeature(
              relatedId,
            ),
        });
      }),
    );
  }

  detectHierarchyCycle() {
    const visiting = new Set();
    const visited = new Set();

    const visit = (feature) => {
      if (visiting.has(feature.id)) {
        return true;
      }

      if (visited.has(feature.id)) {
        return false;
      }

      visiting.add(feature.id);

      if (feature.parentFeatureId) {
        const parent =
          this.repository.getFeature(
            feature.parentFeatureId,
          );

        if (parent && visit(parent)) {
          return true;
        }
      }

      visiting.delete(feature.id);
      visited.add(feature.id);
      return false;
    };

    for (
      const feature of
      this.repository.listFeatures()
    ) {
      if (visit(feature)) {
        return true;
      }
    }

    return false;
  }

  explainFeature(featureId) {
    const feature =
      this.repository.getFeature(featureId);

    if (!feature) {
      throw new Error(
        `Unknown morphologic feature: ${featureId}`,
      );
    }

    return Object.freeze({
      engineVersion:
        MORPHOLOGIC_FEATURE_ONTOLOGY_ENGINE_VERSION,
      feature,
      hierarchy: this.hierarchy(featureId),
      relations:
        this.relatedFeatures(featureId),
      safetyStatement:
        "Morphologic ontology describes structured knowledge and does not create a definitive diagnosis.",
    });
  }
}
