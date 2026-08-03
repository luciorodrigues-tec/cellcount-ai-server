export const HEMATOLOGIC_DISEASE_KNOWLEDGE_ENGINE_VERSION =
  "CRR-000025-v1.0.0";

export class HematologicDiseaseKnowledgeEngine {
  constructor({
    repository,
    policy,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "HematologicDiseaseKnowledgeEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = policy;
  }

  resolve(termOrId) {
    return (
      this.repository.getDisease(termOrId) ||
      this.repository.resolveTerm(termOrId)
    );
  }

  diseaseProfile(diseaseId) {
    const disease =
      this.repository.getDisease(diseaseId);

    if (!disease) {
      throw new Error(
        `Unknown hematologic disease: ${diseaseId}`,
      );
    }

    const relations =
      this.repository.listRelations().filter(
        (item) =>
          item.sourceDiseaseId === diseaseId,
      );

    return Object.freeze({
      engineVersion:
        HEMATOLOGIC_DISEASE_KNOWLEDGE_ENGINE_VERSION,
      disease,
      children:
        this.repository.childrenOf(diseaseId),
      relations: Object.freeze(relations),
      morphologyFeatureIds:
        disease.morphologyFeatureIds,
      diagnosticCriteriaSetIds:
        disease.diagnosticCriteriaSetIds,
      classificationIds:
        disease.classificationIds,
      confirmatoryTestIds:
        disease.confirmatoryTestIds,
      differentialDiseaseIds:
        disease.differentialDiseaseIds,
      evidenceSourceIds:
        disease.evidenceSourceIds,
      safetyStatement:
        "Disease knowledge is structured decision support and does not establish a definitive diagnosis.",
    });
  }

  compareDiseases(leftDiseaseId, rightDiseaseId) {
    const left = this.diseaseProfile(leftDiseaseId);
    const right = this.diseaseProfile(rightDiseaseId);

    const intersect = (a, b) => {
      const rightSet = new Set(b);
      return Object.freeze(
        a.filter((value) => rightSet.has(value)),
      );
    };

    return Object.freeze({
      leftDisease: left.disease,
      rightDisease: right.disease,
      sharedMorphologyFeatureIds:
        intersect(
          left.morphologyFeatureIds,
          right.morphologyFeatureIds,
        ),
      sharedCriteriaSetIds:
        intersect(
          left.diagnosticCriteriaSetIds,
          right.diagnosticCriteriaSetIds,
        ),
      sharedClassificationIds:
        intersect(
          left.classificationIds,
          right.classificationIds,
        ),
      sharedConfirmatoryTestIds:
        intersect(
          left.confirmatoryTestIds,
          right.confirmatoryTestIds,
        ),
    });
  }

  detectHierarchyCycle() {
    const visiting = new Set();
    const visited = new Set();

    const visit = (disease) => {
      if (visiting.has(disease.id)) {
        return true;
      }
      if (visited.has(disease.id)) {
        return false;
      }

      visiting.add(disease.id);

      if (disease.parentDiseaseId) {
        const parent =
          this.repository.getDisease(
            disease.parentDiseaseId,
          );

        if (parent && visit(parent)) {
          return true;
        }
      }

      visiting.delete(disease.id);
      visited.add(disease.id);
      return false;
    };

    for (
      const disease of
      this.repository.listDiseases()
    ) {
      if (visit(disease)) {
        return true;
      }
    }

    return false;
  }
}
