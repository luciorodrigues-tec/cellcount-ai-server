export const GUIDELINE_BRANCH_RESOLVER_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineBranchResolver {
  constructor({
    conditionEvaluator,
  } = {}) {
    this.conditionEvaluator =
      conditionEvaluator;
  }

  resolve({
    node,
    guideline,
    context = {},
  } = {}) {
    const branches =
      guideline.branches
        .filter((branch) =>
          node.branchIds.includes(
            branch.branchId,
          ),
        )
        .sort(
          (a, b) =>
            a.priority - b.priority,
        );

    const conditions =
      new Map(
        guideline.conditions.map(
          (condition) => [
            condition.conditionId,
            condition,
          ],
        ),
      );

    const evaluations = [];

    for (const branch of branches) {
      const condition =
        conditions.get(branch.conditionId);

      if (!condition) {
        evaluations.push(
          Object.freeze({
            branchId: branch.branchId,
            matched: false,
            reason: "Condition not found.",
          }),
        );
        continue;
      }

      const result =
        this.conditionEvaluator.evaluate(
          condition,
          context,
        );

      evaluations.push(
        Object.freeze({
          branchId: branch.branchId,
          conditionId:
            condition.conditionId,
          matched: result.matched,
          reason: result.reason,
          evaluatedExpression:
            result.evaluatedExpression,
        }),
      );

      if (result.matched) {
        return Object.freeze({
          selectedBranch: branch,
          evaluations:
            Object.freeze(evaluations),
        });
      }
    }

    return Object.freeze({
      selectedBranch: null,
      evaluations:
        Object.freeze(evaluations),
    });
  }
}
