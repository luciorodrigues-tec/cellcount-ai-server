import {
  DashboardId,
} from "../domain/DashboardId.js";

import {
  ClinicalGovernanceDashboard,
} from "../domain/ClinicalGovernanceDashboard.js";

export const CLINICAL_GOVERNANCE_DASHBOARD_ENGINE_VERSION =
  "CGL-000006-S2-v1.0.0";

export class ClinicalGovernanceDashboardEngine {
  constructor({
    metricAggregator,
    alertAggregator,
    widgetFactory,
    snapshotBuilder,
    validationService,
    clock = () => new Date(),
  } = {}) {
    this.metricAggregator = metricAggregator;
    this.alertAggregator = alertAggregator;
    this.widgetFactory = widgetFactory;
    this.snapshotBuilder = snapshotBuilder;
    this.validationService = validationService;
    this.clock = clock;
  }

  build({
    dashboardId,
    name,
    scope,
    period,
    auditRecords = [],
    provenanceRecords = [],
    policyResults = [],
    guidelineResults = [],
    qualityRecords = [],
    safetyResults = [],
    operationalMetrics = {},
    filters = [],
    metadata = {},
  } = {}) {
    const now = this.clock();

    const metrics =
      this.metricAggregator.aggregate({
        auditRecords,
        provenanceRecords,
        policyResults,
        guidelineResults,
        qualityRecords,
        safetyResults,
        operationalMetrics,
      });

    const alerts =
      this.alertAggregator.aggregate({
        qualityRecords,
        safetyResults,
        createdAt: now,
      });

    const widgets =
      this.widgetFactory.createDefaultWidgets(
        metrics,
        alerts,
      );

    const snapshot =
      this.snapshotBuilder.build({
        snapshotId:
          `${dashboardId}-SNAPSHOT-1`,
        metrics,
        alerts,
        generatedAt: now,
      });

    const dashboard =
      new ClinicalGovernanceDashboard({
        dashboardId:
          dashboardId instanceof DashboardId
            ? dashboardId
            : new DashboardId(dashboardId),
        name,
        scope,
        period,
        metrics,
        widgets,
        alerts,
        snapshots: [snapshot],
        filters,
        createdAt: now,
        metadata,
      });

    const validation =
      this.validationService.validate(
        dashboard,
      );

    if (!validation.valid) {
      throw new Error(
        `Invalid clinical governance dashboard: ${validation.issues.join(", ")}`,
      );
    }

    return dashboard;
  }
}
