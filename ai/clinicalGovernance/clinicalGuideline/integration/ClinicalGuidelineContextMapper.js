export const CLINICAL_GUIDELINE_CONTEXT_MAPPER_VERSION =
  "CGL-000004-S3-v1.0.0";

export class ClinicalGuidelineContextMapper {
  map({
    caseContext = {},
    reasoningResult = null,
    consensusResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    safetyGateResult = null,
    policyDecision = null,
    auditRecord = null,
    provenanceRecord = null,
    metadata = {},
  } = {}) {
    return Object.freeze({
      ...caseContext,
      selectedHypothesisId:
        reasoningResult?.selectedHypothesisId ??
        consensusResult?.selectedHypothesisId ??
        caseContext.selectedHypothesisId ??
        null,
      riskClass:
        reasoningResult?.riskClass ??
        safetyGateResult?.riskClass ??
        caseContext.riskClass ??
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
      releaseAllowed:
        safetyGateResult?.releaseAllowed ??
        null,
      automationAllowed:
        safetyGateResult?.automationAllowed ??
        null,
      requiresHumanReview:
        safetyGateResult?.requiresHumanReview ??
        policyDecision?.requiresHumanReview ??
        null,
      policyDecision:
        policyDecision?.decision ??
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
