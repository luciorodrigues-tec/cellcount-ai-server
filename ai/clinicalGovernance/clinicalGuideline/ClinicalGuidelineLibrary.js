import {
  ClinicalGuidelineEngine,
} from "./application/ClinicalGuidelineEngine.js";

import {
  GuidelineConditionEvaluator,
} from "./application/GuidelineConditionEvaluator.js";

import {
  GuidelineBranchResolver,
} from "./application/GuidelineBranchResolver.js";

import {
  GuidelineNavigator,
} from "./application/GuidelineNavigator.js";

import {
  GuidelineRecommendationResolver,
} from "./application/GuidelineRecommendationResolver.js";

import {
  GuidelineOutcomeResolver,
} from "./application/GuidelineOutcomeResolver.js";

import {
  GuidelineValidationService,
} from "./application/GuidelineValidationService.js";

import {
  GuidelineSerializer,
} from "./application/GuidelineSerializer.js";

import {
  GuidelineExporter,
} from "./application/GuidelineExporter.js";

import {
  ClinicalGuidelineRepository,
} from "./repository/ClinicalGuidelineRepository.js";

import {
  ClinicalGuidelineContextMapper,
} from "./integration/ClinicalGuidelineContextMapper.js";

import {
  ClinicalGuidelineAuditAdapter,
} from "./integration/ClinicalGuidelineAuditAdapter.js";

import {
  ClinicalGuidelineProvenanceAdapter,
} from "./integration/ClinicalGuidelineProvenanceAdapter.js";

import {
  ClinicalGuidelineIntegrationService,
} from "./integration/ClinicalGuidelineIntegrationService.js";

export function createClinicalGuidelineLibrary({
  clock = () => new Date(),
} = {}) {
  const conditionEvaluator =
    new GuidelineConditionEvaluator();

  const branchResolver =
    new GuidelineBranchResolver({
      conditionEvaluator,
    });

  const navigator =
    new GuidelineNavigator();

  const recommendationResolver =
    new GuidelineRecommendationResolver();

  const outcomeResolver =
    new GuidelineOutcomeResolver();

  const validationService =
    new GuidelineValidationService();

  const engine =
    new ClinicalGuidelineEngine({
      validationService,
      conditionEvaluator,
      navigator,
      recommendationResolver,
      outcomeResolver,
      clock,
    });

  const repository =
    new ClinicalGuidelineRepository();

  const contextMapper =
    new ClinicalGuidelineContextMapper();

  const auditAdapter =
    new ClinicalGuidelineAuditAdapter();

  const provenanceAdapter =
    new ClinicalGuidelineProvenanceAdapter();

  const integrationService =
    new ClinicalGuidelineIntegrationService({
      guidelineEngine: engine,
      repository,
      contextMapper,
      auditAdapter,
      provenanceAdapter,
      clock,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    conditionEvaluator,
    branchResolver,
    navigator,
    recommendationResolver,
    outcomeResolver,
    validationService,
    serializer:
      new GuidelineSerializer(),
    exporter:
      new GuidelineExporter(),
    contextMapper,
    auditAdapter,
    provenanceAdapter,
  });
}
