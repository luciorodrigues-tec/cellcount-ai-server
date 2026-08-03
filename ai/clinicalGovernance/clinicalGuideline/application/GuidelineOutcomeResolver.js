export const GUIDELINE_OUTCOME_RESOLVER_VERSION =
  "CGL-000004-S2-v1.0.0";

export class GuidelineOutcomeResolver {
  resolve(node, guideline) {
    if (!node.outcomeId) {
      return null;
    }

    return (
      guideline.outcomes.find(
        (outcome) =>
          outcome.outcomeId ===
          node.outcomeId,
      ) || null
    );
  }
}
