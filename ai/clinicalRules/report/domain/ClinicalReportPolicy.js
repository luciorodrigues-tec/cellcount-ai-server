export const CLINICAL_REPORT_POLICY_VERSION =
  "CRR-000013-v1.0.0";

export const DEFAULT_CLINICAL_REPORT_POLICY =
  Object.freeze({
    version:
      CLINICAL_REPORT_POLICY_VERSION,
    includeEmptySections: false,
    includeAuditTrail: true,
    includeEngineVersions: true,
    maximumDifferentialItems: 10,
    maximumAlerts: 20,
    requireHumanReviewOnMissingRanking: true,
    requireHumanReviewOnPipelineError: true,
    language: "pt-BR",
  });

export function mergeClinicalReportPolicy(
  overrides = {},
) {
  return Object.freeze({
    ...DEFAULT_CLINICAL_REPORT_POLICY,
    ...(overrides && typeof overrides === "object"
      ? overrides
      : {}),
  });
}
