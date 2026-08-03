import {
  ClinicalGuidelineContextMapper,
} from "./ClinicalGuidelineContextMapper.js";

import {
  ClinicalGuidelineAuditAdapter,
} from "./ClinicalGuidelineAuditAdapter.js";

import {
  ClinicalGuidelineProvenanceAdapter,
} from "./ClinicalGuidelineProvenanceAdapter.js";

export const CLINICAL_GUIDELINE_INTEGRATION_SERVICE_VERSION =
  "CGL-000004-S3-v1.0.0";

export class ClinicalGuidelineIntegrationService {
  constructor({
    guidelineEngine,
    repository,
    contextMapper =
      new ClinicalGuidelineContextMapper(),
    auditAdapter =
      new ClinicalGuidelineAuditAdapter(),
    provenanceAdapter =
      new ClinicalGuidelineProvenanceAdapter(),
    clock = () => new Date(),
  } = {}) {
    if (!guidelineEngine) {
      throw new TypeError(
        "ClinicalGuidelineIntegrationService.guidelineEngine is required.",
      );
    }

    if (!repository) {
      throw new TypeError(
        "ClinicalGuidelineIntegrationService.repository is required.",
      );
    }

    this.guidelineEngine =
      guidelineEngine;
    this.repository =
      repository;
    this.contextMapper =
      contextMapper;
    this.auditAdapter =
      auditAdapter;
    this.provenanceAdapter =
      provenanceAdapter;
    this.clock = clock;
  }

  executeApplicable({
    caseContext = {},
    reasoningResult = null,
    consensusResult = null,
    confidenceCalibrationResult = null,
    uncertaintyResult = null,
    safetyGateResult = null,
    policyDecision = null,
    auditRecord = null,
    provenanceRecord = null,
    scopeType = null,
    targetId = null,
    metadata = {},
  } = {}) {
    const context =
      this.contextMapper.map({
        caseContext,
        reasoningResult,
        consensusResult,
        confidenceCalibrationResult,
        uncertaintyResult,
        safetyGateResult,
        policyDecision,
        auditRecord,
        provenanceRecord,
        metadata,
      });

    const guidelines =
      [...this.repository.findActive({
        at: this.clock(),
        scopeType,
        targetId,
      })].sort(
        (a, b) =>
          a.priority.value -
          b.priority.value,
      );

    const executions =
      guidelines.map(
        (guideline) => {
          const executionResult =
            this.guidelineEngine.execute(
              guideline,
              context,
            );

          return Object.freeze({
            guideline,
            executionResult,
            auditPayload:
              this.auditAdapter.toAuditPayload({
                guideline,
                executionResult,
              }),
            provenancePayload:
              this.provenanceAdapter.toProvenancePayload({
                guideline,
                executionResult,
              }),
          });
        },
      );

    const primary =
      executions[0] || null;

    return Object.freeze({
      context,
      guidelineCount:
        guidelines.length,
      executions:
        Object.freeze(executions),
      primaryGuidelineId:
        primary
          ?.guideline.guidelineId.toString() ??
        null,
      primaryExecutionResult:
        primary?.executionResult ??
        null,
      requiresHumanReview:
        executions.some(
          (execution) =>
            execution.executionResult
              .requiresHumanReview,
        ),
    });
  }
}
