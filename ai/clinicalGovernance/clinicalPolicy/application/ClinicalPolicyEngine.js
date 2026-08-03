import {
  PolicyConditionEvaluator,
} from "./PolicyConditionEvaluator.js";

import {
  PolicyScopeResolver,
} from "./PolicyScopeResolver.js";

import {
  PolicyOverrideResolver,
} from "./PolicyOverrideResolver.js";

import {
  PolicyRuleEvaluator,
} from "./PolicyRuleEvaluator.js";

import {
  PolicyDecisionResolver,
} from "./PolicyDecisionResolver.js";

import {
  PolicyValidationService,
} from "./PolicyValidationService.js";

export const CLINICAL_POLICY_ENGINE_VERSION =
  "CGL-000003-S2-v1.0.0";

export class ClinicalPolicyEngine {
  constructor({
    conditionEvaluator =
      new PolicyConditionEvaluator(),
    scopeResolver =
      new PolicyScopeResolver(),
    overrideResolver =
      new PolicyOverrideResolver(),
    decisionResolver =
      new PolicyDecisionResolver(),
    validationService =
      new PolicyValidationService(),
    clock = () => new Date(),
  } = {}) {
    this.conditionEvaluator =
      conditionEvaluator;
    this.scopeResolver =
      scopeResolver;
    this.overrideResolver =
      overrideResolver;
    this.decisionResolver =
      decisionResolver;
    this.validationService =
      validationService;
    this.clock = clock;
  }

  evaluate(policy, context = {}) {
    const validation =
      this.validationService.validate(
        policy,
      );

    if (!validation.valid) {
      throw new Error(
        `Invalid clinical policy: ${validation.issues.join(", ")}`,
      );
    }

    if (!policy.isActive()) {
      return Object.freeze({
        applicable: false,
        reason:
          `Policy status is ${policy.status}.`,
        decision: null,
        evaluations: Object.freeze([]),
      });
    }

    if (
      !this.scopeResolver.matches(
        policy.scope,
        context,
      )
    ) {
      return Object.freeze({
        applicable: false,
        reason:
          "Policy scope does not match context.",
        decision: null,
        evaluations: Object.freeze([]),
      });
    }

    const activeOverrides =
      this.overrideResolver.resolve(
        policy.overrides,
        {
          now: this.clock(),
        },
      );

    const ruleEvaluator =
      new PolicyRuleEvaluator({
        conditionEvaluator:
          this.conditionEvaluator,
        overrideResolver:
          this.overrideResolver,
      });

    const evaluations =
      policy.rules.map(
        (rule) =>
          ruleEvaluator.evaluate(
            rule,
            context,
            activeOverrides,
          ),
      );

    const decision =
      this.decisionResolver.resolve(
        policy,
        evaluations,
      );

    return Object.freeze({
      applicable: true,
      reason: decision.reason,
      decision,
      evaluations:
        Object.freeze(evaluations),
      activeOverrides,
    });
  }
}
