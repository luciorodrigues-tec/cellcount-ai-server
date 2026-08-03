export const CLINICAL_GOVERNANCE_DASHBOARD_INTEGRATION_SERVICE_VERSION =
  "CGL-000006-S3-v1.0.0";

export class ClinicalGovernanceDashboardIntegrationService {
  constructor({
    dashboardEngine,
    repository,
    auditAdapter,
    provenanceAdapter,
  } = {}) {
    if (!dashboardEngine) {
      throw new TypeError(
        "ClinicalGovernanceDashboardIntegrationService.dashboardEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "ClinicalGovernanceDashboardIntegrationService.repository is required.",
      );
    }

    this.dashboardEngine = dashboardEngine;
    this.repository = repository;
    this.auditAdapter = auditAdapter;
    this.provenanceAdapter = provenanceAdapter;
  }

  buildAndStore({
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
    replace = false,
  } = {}) {
    const dashboard = this.dashboardEngine.build({
      dashboardId,
      name,
      scope,
      period,
      auditRecords,
      provenanceRecords,
      policyResults,
      guidelineResults,
      qualityRecords,
      safetyResults,
      operationalMetrics,
      filters,
      metadata,
    });

    this.repository.save(dashboard, { replace });

    return Object.freeze({
      dashboard,
      auditPayload:
        this.auditAdapter.toAuditPayload(dashboard),
      provenancePayload:
        this.provenanceAdapter.toProvenancePayload(dashboard),
    });
  }
}
