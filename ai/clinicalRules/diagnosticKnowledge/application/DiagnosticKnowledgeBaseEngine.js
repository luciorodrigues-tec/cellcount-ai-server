export const DIAGNOSTIC_KNOWLEDGE_BASE_ENGINE_VERSION =
  "CRR-000015-v1.0.0";

export class DiagnosticKnowledgeBaseEngine {
  constructor({ repository } = {}) {
    if (!repository) {
      throw new TypeError(
        "DiagnosticKnowledgeBaseEngine requires a repository.",
      );
    }

    this.repository = repository;
  }

  classificationProfile(classificationId) {
    const classification =
      this.repository.getClassification(
        classificationId,
      );

    if (!classification) {
      throw new Error(
        `Unknown diagnostic classification: ${classificationId}`,
      );
    }

    const entities =
      this.repository.listEntities({
        classificationId,
      });

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_KNOWLEDGE_BASE_ENGINE_VERSION,
      classification,
      entityCount: entities.length,
      diseaseEntities:
        Object.freeze(
          entities.filter(
            (item) =>
              item.type === "DISEASE_ENTITY",
          ),
        ),
      diseaseCategories:
        Object.freeze(
          entities.filter(
            (item) =>
              item.type === "DISEASE_CATEGORY",
          ),
        ),
      criteria:
        Object.freeze(
          entities.filter(
            (item) =>
              item.type === "DIAGNOSTIC_CRITERION",
          ),
        ),
      riskGroups:
        Object.freeze(
          entities.filter(
            (item) =>
              item.type === "RISK_GROUP",
          ),
        ),
      recommendedTests:
        Object.freeze(
          entities.filter(
            (item) =>
              item.type === "RECOMMENDED_TEST",
          ),
        ),
      safetyStatement:
        "The structured repository is knowledge support and not a definitive diagnosis.",
    });
  }

  compareClassifications(
    leftClassificationId,
    rightClassificationId,
  ) {
    const left =
      this.classificationProfile(
        leftClassificationId,
      );
    const right =
      this.classificationProfile(
        rightClassificationId,
      );

    const normalize = (value) =>
      String(value || "")
        .trim()
        .toLowerCase();

    const leftByLabel = new Map(
      left.diseaseEntities.map((item) => [
        normalize(item.label),
        item,
      ]),
    );

    const rightByLabel = new Map(
      right.diseaseEntities.map((item) => [
        normalize(item.label),
        item,
      ]),
    );

    const sharedLabels = [
      ...leftByLabel.keys(),
    ].filter((label) =>
      rightByLabel.has(label),
    );

    return Object.freeze({
      leftClassification:
        left.classification,
      rightClassification:
        right.classification,
      sharedDiseaseLabels:
        Object.freeze(sharedLabels),
      onlyLeftDiseaseEntityIds:
        Object.freeze(
          [...leftByLabel.entries()]
            .filter(
              ([label]) =>
                !rightByLabel.has(label),
            )
            .map(([, entity]) => entity.id),
        ),
      onlyRightDiseaseEntityIds:
        Object.freeze(
          [...rightByLabel.entries()]
            .filter(
              ([label]) =>
                !leftByLabel.has(label),
            )
            .map(([, entity]) => entity.id),
        ),
    });
  }

  resolveEntityHierarchy(entityId) {
    const entity =
      this.repository.getEntity(entityId);

    if (!entity) {
      throw new Error(
        `Unknown diagnostic knowledge entity: ${entityId}`,
      );
    }

    const ancestors = [];
    let current = entity;
    const visited = new Set();

    while (
      current?.parentEntityId &&
      !visited.has(current.id)
    ) {
      visited.add(current.id);
      const parent =
        this.repository.getEntity(
          current.parentEntityId,
        );

      if (!parent) {
        break;
      }

      ancestors.push(parent);
      current = parent;
    }

    return Object.freeze({
      entity,
      ancestors: Object.freeze(ancestors),
      children:
        this.repository.childrenOf(entityId),
    });
  }
}
