import {
  DashboardMetricAggregator,
} from "./application/DashboardMetricAggregator.js";

import {
  DashboardAlertAggregator,
} from "./application/DashboardAlertAggregator.js";

import {
  DashboardWidgetFactory,
} from "./application/DashboardWidgetFactory.js";

import {
  DashboardFilterEngine,
} from "./application/DashboardFilterEngine.js";

import {
  DashboardSnapshotBuilder,
} from "./application/DashboardSnapshotBuilder.js";

import {
  DashboardValidationService,
} from "./application/DashboardValidationService.js";

import {
  DashboardSerializer,
} from "./application/DashboardSerializer.js";

import {
  DashboardExporter,
} from "./application/DashboardExporter.js";

import {
  ClinicalGovernanceDashboardEngine,
} from "./application/ClinicalGovernanceDashboardEngine.js";

import {
  ClinicalGovernanceDashboardRepository,
} from "./repository/ClinicalGovernanceDashboardRepository.js";

import {
  DashboardAuditAdapter,
} from "./integration/DashboardAuditAdapter.js";

import {
  DashboardProvenanceAdapter,
} from "./integration/DashboardProvenanceAdapter.js";

import {
  ClinicalGovernanceDashboardIntegrationService,
} from "./integration/ClinicalGovernanceDashboardIntegrationService.js";

export function createClinicalGovernanceDashboardLibrary({
  clock = () => new Date(),
} = {}) {
  const metricAggregator =
    new DashboardMetricAggregator();

  const alertAggregator =
    new DashboardAlertAggregator();

  const widgetFactory =
    new DashboardWidgetFactory();

  const filterEngine =
    new DashboardFilterEngine();

  const snapshotBuilder =
    new DashboardSnapshotBuilder();

  const validationService =
    new DashboardValidationService();

  const engine =
    new ClinicalGovernanceDashboardEngine({
      metricAggregator,
      alertAggregator,
      widgetFactory,
      snapshotBuilder,
      validationService,
      clock,
    });

  const repository =
    new ClinicalGovernanceDashboardRepository();

  const auditAdapter =
    new DashboardAuditAdapter();

  const provenanceAdapter =
    new DashboardProvenanceAdapter();

  const integrationService =
    new ClinicalGovernanceDashboardIntegrationService({
      dashboardEngine: engine,
      repository,
      auditAdapter,
      provenanceAdapter,
    });

  return Object.freeze({
    engine,
    repository,
    integrationService,
    metricAggregator,
    alertAggregator,
    widgetFactory,
    filterEngine,
    snapshotBuilder,
    validationService,
    serializer: new DashboardSerializer(),
    exporter: new DashboardExporter(),
    auditAdapter,
    provenanceAdapter,
  });
}
