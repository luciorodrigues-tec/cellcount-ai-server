export const EXPLAINABLE_DECISION_TREE_REPOSITORY_VERSION =
  "CRR-000032-v1.0.0";

export class ExplainableDecisionTreeRepository {
  constructor({
    version =
      EXPLAINABLE_DECISION_TREE_REPOSITORY_VERSION,
  } = {}) {
    this.version = String(version);
    this._trees = new Map();
  }

  save(tree, { replace = false } = {}) {
    if (this._trees.has(tree.caseId) && !replace) {
      throw new Error(
        `Explainable decision tree already exists for case: ${tree.caseId}`,
      );
    }

    this._trees.set(tree.caseId, tree);
    return tree;
  }

  get(caseId) {
    return this._trees.get(String(caseId)) || null;
  }

  list() {
    return Object.freeze([...this._trees.values()]);
  }
}
