export const CLINICAL_POLICY_CONTEXT_MAPPER_VERSION =
  "CGL-000003-S3-v1.0.0";

export class ClinicalPolicyContextMapper {
  map({
    caseContext = {},
    organizationId = null,
    laboratoryId = null,
    departmentId = null,
    workflowId = null,
    engineId = null,
    safetyGateResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    auditRecord = null,
    provenanceRecord = null,
    metadata = {},
  } = {}) {
    return Object.freeze({
      ...caseContext,
      organizationId,
      laboratoryId,
      departmentId,
      workflowId,
      engineId,
      releaseAllowed:
        safetyGateResult?.releaseAllowed ??
        null,
      automationAllowed:
        safetyGateResult?.automationAllowed ??
        null,
      requiresHumanReview:
        safetyGateResult?.requiresHumanReview ??
        null,
      safetyScore:
        safetyGateResult?.safetyScore ??
        null,
      confidence:
        confidenceCalibrationResult
          ?.finalConfidenceScore ??
        caseContext.confidence ??
        null,
      uncertainty:
        uncertaintyResult
          ?.totalUncertaintyScore ??
        caseContext.uncertainty ??
        null,
      auditId:
        auditRecord?.auditId?.toString?.() ??
        metadata.auditId ??
        null,
      provenanceId:
        provenanceRecord
          ?.provenanceId?.toString?.() ??
        metadata.provenanceId ??
        null,
      metadata: Object.freeze({
        ...(metadata &&
        typeof metadata === "object"
          ? metadata
          : {}),
      }),
    });
  }
}
