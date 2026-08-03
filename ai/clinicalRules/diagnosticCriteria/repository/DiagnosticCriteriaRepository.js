export const DIAGNOSTIC_CRITERIA_REPOSITORY_VERSION =
  "CRR-000019-v1.0.0";

export class DiagnosticCriteriaRepository {
  constructor({
    version = DIAGNOSTIC_CRITERIA_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._criteria = new Map();
    this._sets = new Map();
  }

  registerCriterion(criterion, { replace = false } = {}) {
    if (this._criteria.has(criterion.id) && !replace) {
      throw new Error(
        `Diagnostic criterion already registered: ${criterion.id}`,
      );
    }
    this._criteria.set(criterion.id, criterion);
    return criterion;
  }

  registerSet(criteriaSet, { replace = false } = {}) {
    if (this._sets.has(criteriaSet.id) && !replace) {
      throw new Error(
        `Diagnostic criteria set already registered: ${criteriaSet.id}`,
      );
    }

    for (const criterionId of criteriaSet.criterionIds) {
      if (!this._criteria.has(criterionId)) {
        throw new Error(
          `Unknown diagnostic criterion: ${criterionId}`,
        );
      }

      const criterion = this._criteria.get(criterionId);
      if (
        criterion.classificationId !== criteriaSet.classificationId ||
        criterion.diseaseEntityId !== criteriaSet.diseaseEntityId
      ) {
        throw new Error(
          `Criterion ${criterionId} does not belong to criteria set context.`,
        );
      }
    }

    this._sets.set(criteriaSet.id, criteriaSet);
    return criteriaSet;
  }

  getCriterion(id) {
    return this._criteria.get(String(id)) || null;
  }

  getSet(id) {
    return this._sets.get(String(id)) || null;
  }

  listCriteria({
    classificationId = null,
    diseaseEntityId = null,
    type = null,
  } = {}) {
    return Object.freeze(
      [...this._criteria.values()].filter(
        (criterion) =>
          (!classificationId ||
            criterion.classificationId === String(classificationId)) &&
          (!diseaseEntityId ||
            criterion.diseaseEntityId === String(diseaseEntityId)) &&
          (!type ||
            criterion.type === String(type).trim().toUpperCase()),
      ),
    );
  }

  listSets({
    classificationId = null,
    diseaseEntityId = null,
  } = {}) {
    return Object.freeze(
      [...this._sets.values()].filter(
        (criteriaSet) =>
          (!classificationId ||
            criteriaSet.classificationId === String(classificationId)) &&
          (!diseaseEntityId ||
            criteriaSet.diseaseEntityId === String(diseaseEntityId)),
      ),
    );
  }
}
