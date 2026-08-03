import {
  GuidelineConditionEvaluator,
} from "./GuidelineConditionEvaluator.js";

import {
  GuidelineBranchResolver,
} from "./GuidelineBranchResolver.js";

import {
  GuidelineNavigator,
} from "./GuidelineNavigator.js";

import {
  GuidelineRecommendationResolver,
} from "./GuidelineRecommendationResolver.js";

import {
  GuidelineOutcomeResolver,
} from "./GuidelineOutcomeResolver.js";

import {
  GuidelineValidationService,
} from "./GuidelineValidationService.js";

import {
  GuidelineExecutionService,
} from "./GuidelineExecutionService.js";

export const CLINICAL_GUIDELINE_ENGINE_VERSION =
  "CGL-000004-S2-v1.0.0";

export class ClinicalGuidelineEngine {
  constructor({
    validationService =
      new GuidelineValidationService(),
    conditionEvaluator =
      new GuidelineConditionEvaluator(),
    navigator =
      new GuidelineNavigator(),
    recommendationResolver =
      new GuidelineRecommendationResolver(),
    outcomeResolver =
      new GuidelineOutcomeResolver(),
    clock = () => new Date(),
  } = {}) {
    this.validationService =
      validationService;

    this.branchResolver =
      new GuidelineBranchResolver({
        conditionEvaluator,
      });

    this.executionService =
      new GuidelineExecutionService({
        navigator,
        branchResolver:
          this.branchResolver,
        recommendationResolver,
        outcomeResolver,
        clock,
      });
  }

  execute(guideline, context = {}) {
    const validation =
      this.validationService.validate(
        guideline,
      );

    if (!validation.valid) {
      throw new Error(
        `Invalid clinical guideline: ${validation.issues.join(", ")}`,
      );
    }

    if (!guideline.isActive()) {
      throw new Error(
        `Clinical guideline is not active: ${guideline.status}`,
      );
    }

    return this.executionService.execute(
      guideline,
      context,
    );
  }
}
