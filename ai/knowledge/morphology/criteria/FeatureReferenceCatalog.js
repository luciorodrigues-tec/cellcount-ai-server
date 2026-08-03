export class FeatureReferenceCatalog {
  constructor(featureIds = []) {
    this._ids =
      new Set(
        featureIds
          .map(String)
          .map((item) => item.trim())
          .filter(Boolean),
      );
  }

  has(featureId) {
    return this._ids.has(
      String(featureId).trim(),
    );
  }

  list() {
    return [...this._ids].sort();
  }

  get size() {
    return this._ids.size;
  }
}

export function createFeatureReferenceCatalogFromCells(
  cells = [],
) {
  const ids = [];

  for (const cell of cells) {
    const criteriaGroups = [
      cell.positiveCriteria,
      cell.negativeCriteria,
      cell.exclusionCriteria,
      cell.limitationCriteria,
    ];

    for (const group of criteriaGroups) {
      for (const criterion of group || []) {
        for (
          const featureKey
          of criterion.featureKeys || []
        ) {
          ids.push(featureKey);
        }
      }
    }
  }

  return new FeatureReferenceCatalog(ids);
}
