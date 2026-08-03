import {
  QualityThresholdEngine,
} from "./application/QualityThresholdEngine.js";

import {
  QualityScoreCalculator,
} from "./application/QualityScoreCalculator.js";

import {
  QualityFindingEngine,
} from "./application/QualityFindingEngine.js";

import {
  QualityAlertEngine,
} from "./application/QualityAlertEngine.js";

import {
  QualityRecommendationEngine,
} from "./application/QualityRecommendationEngine.js";

import {
  QualityTrendEngine,
} from "./application/QualityTrendEngine.js";

import {
  QualityBenchmarkEngine,
} from "./application/QualityBenchmarkEngine.js";

import {
  QualityEvaluationEngine,
} from "./application/QualityEvaluationEngine.js";

import {
  QualityReportEngine,
} from "./application/QualityReportEngine.js";

import {
  QualityAssuranceSerializer,
} from "./application/QualityAssuranceSerializer.js";

import {
  QualityAssuranceExporter,
} from "./application/QualityAssuranceExporter.js";

import {
  QualityAssuranceEngine,
} from "./application/QualityAssuranceEngine.js";

import {
  QualityAssuranceRepository,
} from "./repository/QualityAssuranceRepository.js";

import {
  QualityAssuranceContextMapper,
} from "./integration/QualityAssuranceContextMapper.js";

import {
  QualityAssuranceAuditAdapter,
} from "./integration/QualityAssuranceAuditAdapter.js";

import {
  QualityAssuranceProvenanceAdapter,
} from "./integration/QualityAssuranceProvenanceAdapter.js";

import {
  QualityAssuranceIntegrationService,
} from "./integration/QualityAssuranceIntegrationService.js";

export function createQualityAssuranceLibrary({
  clock = () => new Date(),
} = {}) {
  const thresholdEngine =
    new QualityThresholdEngine();

  const scoreCalculator =
    new QualityScoreCalculator();

  const findingEngine =
    new QualityFindingEngine();

  const alertEngine =
    new QualityAlertEngine();

  const recommendationEngine =
    new QualityRecommendationEngine();

  const trendEngine =
    new QualityTrendEngine();

  const benchmarkEngine =
    new QualityBenchmarkEngine();

  const reportEngine =
    new QualityReportEngine();

  const evaluationEngine =
    new QualityEvaluationEngine({
      thresholdEngine,
      scoreCalculator,
      findingEngine,
      alertEngine,
      recommendationEngine,
      clock,
    });

  const engine =
    new QualityAssuranceEngine({
      evaluationEngine,
      trendEngine,
      reportEngine,
      clock,
    });

  const repository =
    new QualityAssuranceRepository();

  const contextMapper =
    new QualityAssuranceContextMapper();

  const auditAdapter =
    new QualityAssuranceAuditAdapter();

  const provenanceAdapter =
    new QualityAssuranceProvenanceAdapter();

  const integrationService =
    new QualityAssuranceIntegrationService({
      qualityAssuranceEngine:
        engine,
      repository,
      contextMapper,
      auditAdapter,
      provenanceAdapter,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    thresholdEngine,
    scoreCalculator,
    findingEngine,
    alertEngine,
    recommendationEngine,
    trendEngine,
    benchmarkEngine,
    evaluationEngine,
    reportEngine,
    serializer:
      new QualityAssuranceSerializer(),
    exporter:
      new QualityAssuranceExporter(),
    contextMapper,
    auditAdapter,
    provenanceAdapter,
  });
}
