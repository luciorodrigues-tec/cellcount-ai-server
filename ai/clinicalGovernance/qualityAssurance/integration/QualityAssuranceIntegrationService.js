import {
  QualityAssuranceContextMapper,
} from "./QualityAssuranceContextMapper.js";

import {
  QualityAssuranceAuditAdapter,
} from "./QualityAssuranceAuditAdapter.js";

import {
  QualityAssuranceProvenanceAdapter,
} from "./QualityAssuranceProvenanceAdapter.js";

export const QUALITY_ASSURANCE_INTEGRATION_SERVICE_VERSION =
  "CGL-000005-S3-v1.0.0";

export class QualityAssuranceIntegrationService {
  constructor({
    qualityAssuranceEngine,
    repository,
    contextMapper =
      new QualityAssuranceContextMapper(),
    auditAdapter =
      new QualityAssuranceAuditAdapter(),
    provenanceAdapter =
      new QualityAssuranceProvenanceAdapter(),
  } = {}) {
    if (!qualityAssuranceEngine) {
      throw new TypeError(
        "QualityAssuranceIntegrationService.qualityAssuranceEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "QualityAssuranceIntegrationService.repository is required.",
      );
    }

    this.qualityAssuranceEngine =
      qualityAssuranceEngine;
    this.repository = repository;
    this.contextMapper =
      contextMapper;
    this.auditAdapter =
      auditAdapter;
    this.provenanceAdapter =
      provenanceAdapter;
  }

  evaluateClinicalCase({
    qualityAssuranceId,
    caseId = null,
    period,
    reasoningResult = null,
    consensusResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    validationResult = null,
    safetyGateResult = null,
    auditRecord = null,
    provenanceRecord = null,
    policyResult = null,
    guidelineResult = null,
    operationalMetrics = {},
    benchmarks = [],
    historicalScores = [],
    metadata = {},
    replace = false,
  } = {}) {
    const metrics =
      this.contextMapper.mapMetrics({
        reasoningResult,
        consensusResult,
        confidenceCalibrationResult,
        uncertaintyResult,
        validationResult,
        safetyGateResult,
        auditRecord,
        provenanceRecord,
        policyResult,
        guidelineResult,
        operationalMetrics,
      });

    const record =
      this.qualityAssuranceEngine.evaluate({
        qualityAssuranceId,
        caseId,
        period,
        metrics,
        benchmarks,
        historicalScores,
        metadata: {
          auditId:
            auditRecord
              ?.auditId?.toString?.() ??
            null,
          provenanceId:
            provenanceRecord
              ?.provenanceId?.toString?.() ??
            null,
          ...metadata,
        },
      });

    this.repository.save(
      record,
      { replace },
    );

    return Object.freeze({
      record,
      auditPayload:
        this.auditAdapter.toAuditPayload(
          record,
        ),
      provenancePayload:
        this.provenanceAdapter.toProvenancePayload(
          record,
        ),
    });
  }
}
