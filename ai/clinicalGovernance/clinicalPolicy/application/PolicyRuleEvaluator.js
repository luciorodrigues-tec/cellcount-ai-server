export const POLICY_RULE_EVALUATOR_VERSION =
  "CGL-000003-S2-v1.0.0";

export class PolicyRuleEvaluator {
  constructor({
    conditionEvaluator,
    overrideResolver,
  } = {}) {
    this.conditionEvaluator =
      conditionEvaluator;
    this.overrideResolver =
      overrideResolver;
  }

  evaluate(rule, context, activeOverrides = []) {
    const overridden =
      this.overrideResolver.isOverridden(
        rule.ruleId,
        activeOverrides,
      );

    if (overridden) {
      return Object.freeze({
        ruleId: rule.ruleId,
        matched: false,
        overridden: true,
        effect: "OVERRIDE",
        priority: rule.priority,
        message: rule.message,
      });
    }

    const matched =
      this.conditionEvaluator.evaluate(
        rule.condition,
        context,
      );

    return Object.freeze({
      ruleId: rule.ruleId,
      matched,
      overridden: false,
      effect: rule.effect,
      priority: rule.priority,
      message: rule.message,
    });
  }
}
